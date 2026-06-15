import Head from 'next/head';
import Layout from '../components/layout';
import { getServerSession } from 'next-auth/next';
import { options } from 'app/api/auth/[...nextauth]/options';
import { prisma } from '@/utils/prisma';
import { getCanonicalEmail } from '@/utils/auth';
import { GetServerSidePropsContext } from 'next';
import { useState } from 'react';
import { useFlashMessage } from '@/components/flashMessage/FlashMessageContext';
import styles from '@/styles/car.module.css';
import CarOverviewCard from '@/components/car/CarOverviewCard';
import CarInsuranceSection from '@/components/car/CarInsuranceSection';
import CarCheckupsSection from '@/components/car/CarCheckupsSection';
import CarHighwayPassesSection from '@/components/car/CarHighwayPassesSection';
import CarModal, {
  CarModalMode,
  OverviewFormData,
  DocFormData,
  HighwayPassFormData,
} from '@/components/car/CarModal';
import { HighwayPassData } from '@/components/car/HighwayPassCard';

interface CarData {
  id: string;
  licensePlate: string | null;
  model: string | null;
  year: number | null;
  image: string | null;
  pzpExpiry: string | null;
  pzpLink: string | null;
  havarijExpiry: string | null;
  havarijLink: string | null;
  stkExpiry: string | null;
  stkLink: string | null;
  ekExpiry: string | null;
  ekLink: string | null;
}

interface CarPageProps {
  car: (CarData & { highwayPasses: HighwayPassData[] }) | null;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { req, res } = context;
  const session = await getServerSession(req, res, options);

  if (!session?.user?.email) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: getCanonicalEmail(session.user.email) },
    });
    if (user) {
      const car = await prisma.car.findUnique({
        where: { userId: user.id },
        include: { highwayPasses: { orderBy: { createdAt: 'asc' } } },
      });
      return { props: { car: JSON.parse(JSON.stringify(car)) } };
    }
  } catch (error) {
    console.error('Error fetching car:', error);
  }

  return { props: { car: null } };
}

function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

function toIso(dateInput: string): string | null {
  return dateInput ? new Date(dateInput).toISOString() : null;
}

function docForm(expiry: string | null, link: string | null): DocFormData {
  return { expiry: toDateInput(expiry), link: link ?? '' };
}

function buildPassForm(p: HighwayPassData): HighwayPassFormData {
  return { country: p.country, expiry: toDateInput(p.expiry), link: p.link ?? '', image: p.image ?? '' };
}

export default function CarPage({ car: initCar }: CarPageProps) {
  const { showMessage } = useFlashMessage();
  const [car, setCar] = useState<CarData | null>(initCar ?? null);
  const [passes, setPasses] = useState<HighwayPassData[]>(initCar?.highwayPasses ?? []);
  const [modal, setModal] = useState<CarModalMode | null>(null);

  const patchCar = async (body: Record<string, unknown>, msg: string) => {
    const res = await fetch('/api/car', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const { car: updated } = await res.json();
      setCar(updated);
      setPasses(updated.highwayPasses);
      showMessage(msg, 'success');
    } else {
      showMessage('Failed to save', 'error');
      throw new Error('save failed');
    }
  };

  const handleSave = async (
    mode: CarModalMode,
    formData: OverviewFormData | DocFormData | HighwayPassFormData,
  ) => {
    if (mode.kind === 'overview') {
      const d = formData as OverviewFormData;
      await patchCar({
        licensePlate: d.licensePlate.trim() || null,
        model:        d.model.trim() || null,
        year:         d.year ? parseInt(d.year, 10) : null,
        image:        d.image.trim() || null,
      }, 'Car updated');
    }

    if (mode.kind === 'pzp') {
      const d = formData as DocFormData;
      await patchCar({ pzpExpiry: toIso(d.expiry), pzpLink: d.link.trim() || null }, 'PZP updated');
    }

    if (mode.kind === 'havarij') {
      const d = formData as DocFormData;
      await patchCar({ havarijExpiry: toIso(d.expiry), havarijLink: d.link.trim() || null }, 'KASKO updated');
    }

    if (mode.kind === 'stk') {
      const d = formData as DocFormData;
      await patchCar({ stkExpiry: toIso(d.expiry), stkLink: d.link.trim() || null }, 'STK updated');
    }

    if (mode.kind === 'ek') {
      const d = formData as DocFormData;
      await patchCar({ ekExpiry: toIso(d.expiry), ekLink: d.link.trim() || null }, 'EK updated');
    }

    if (mode.kind === 'highwayPass') {
      const d = formData as HighwayPassFormData;
      const body = {
        country: d.country.trim(),
        expiry:  toIso(d.expiry),
        link:    d.link.trim() || null,
        image:   d.image.trim() || null,
      };

      if (mode.editingId) {
        const res = await fetch(`/api/car/highway-passes/${mode.editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const { pass } = await res.json();
          setPasses(prev => prev.map(p => (p.id === mode.editingId ? pass : p)));
          showMessage('Pass updated', 'success');
        } else {
          showMessage('Failed to update pass', 'error');
          throw new Error('update failed');
        }
      } else {
        if (!car) {
          showMessage('Hold the car card first to add details', 'error');
          setModal({ kind: 'overview', initialData: { licensePlate: '', model: '', year: '', image: '' } });
          return;
        }
        const res = await fetch('/api/car/highway-passes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const { pass } = await res.json();
          setPasses(prev => [...prev, pass]);
          showMessage(`${body.country} pass added`, 'success');
        } else {
          showMessage('Failed to add pass', 'error');
          throw new Error('add failed');
        }
      }
    }
  };

  const handleDeletePass = async (id: string) => {
    const res = await fetch(`/api/car/highway-passes/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setPasses(prev => prev.filter(p => p.id !== id));
      showMessage('Pass removed', 'success');
    } else {
      showMessage('Failed to remove pass', 'error');
      throw new Error('delete failed');
    }
  };

  const openPassAdd = () => {
    if (!car) {
      showMessage('Hold the car card first to add details', 'error');
      setModal({ kind: 'overview', initialData: { licensePlate: '', model: '', year: '', image: '' } });
      return;
    }
    setModal({ kind: 'highwayPass', initialData: null, editingId: null });
  };

  return (
    <Layout pageTitle="Car">
      <Head><title>My Car</title></Head>
      <div className={styles.page}>
        <CarOverviewCard
          licensePlate={car?.licensePlate ?? null}
          model={car?.model ?? null}
          year={car?.year ?? null}
          image={car?.image ?? null}
          onEdit={() => setModal({
            kind: 'overview',
            initialData: { licensePlate: car?.licensePlate ?? '', model: car?.model ?? '', year: car?.year ? String(car.year) : '', image: car?.image ?? '' },
          })}
        />

        <CarInsuranceSection
          pzpExpiry={car?.pzpExpiry ?? null}
          pzpLink={car?.pzpLink ?? null}
          havarijExpiry={car?.havarijExpiry ?? null}
          havarijLink={car?.havarijLink ?? null}
          onEditPzp={() => setModal({ kind: 'pzp', initialData: docForm(car?.pzpExpiry ?? null, car?.pzpLink ?? null) })}
          onEditHavarij={() => setModal({ kind: 'havarij', initialData: docForm(car?.havarijExpiry ?? null, car?.havarijLink ?? null) })}
        />

        <CarCheckupsSection
          stkExpiry={car?.stkExpiry ?? null}
          stkLink={car?.stkLink ?? null}
          ekExpiry={car?.ekExpiry ?? null}
          ekLink={car?.ekLink ?? null}
          onEditStk={() => setModal({ kind: 'stk', initialData: docForm(car?.stkExpiry ?? null, car?.stkLink ?? null) })}
          onEditEk={() => setModal({ kind: 'ek', initialData: docForm(car?.ekExpiry ?? null, car?.ekLink ?? null) })}
        />

        <CarHighwayPassesSection
          passes={passes}
          onAdd={openPassAdd}
          onEdit={id => {
            const pass = passes.find(p => p.id === id);
            if (!pass) return;
            setModal({ kind: 'highwayPass', initialData: buildPassForm(pass), editingId: id });
          }}
        />
      </div>

      <CarModal
        open={modal !== null}
        mode={modal}
        onClose={() => setModal(null)}
        onSave={handleSave}
        onDelete={handleDeletePass}
      />
    </Layout>
  );
}

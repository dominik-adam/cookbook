import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import { useSession } from "next-auth/react"
import { signIn, signOut } from "next-auth/react"
import styles from '@/styles/profile.module.css';
import Image from 'next/image';

function formatDateToHumanReadable(isoString) {
  const date = new Date(isoString);
  const options = { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    timeZoneName: 'short' 
  };
  return date.toLocaleDateString('en-US', options);
}

function UserInfo({session, status}) {
  if (status !== "authenticated") {
    return <>
      <div className={styles.notSignedIn}>Not signed in</div>
      <button 
        onClick={() => signIn('google')}
        className={`${styles.profileLogInButton}`}
      >
        Log in
      </button>
    </>;
  }

  return <>
    <Image
      className={styles.profilePicture}
      src={session.user.image}
      height={200}
      width={200}
      alt="Profile picture"
    />
    <div className={styles.profileName}>
      {session.user.name}
    </div>
    <div className={styles.profileEmail}>
      {session.user.email}
    </div>
    <div className={styles.profileExpiration}>
      Session expires at: <b>{formatDateToHumanReadable(session.expires)}</b>
    </div>
    <button 
      onClick={() => signOut('google')}
      className={`${styles.profileLogOutButton}`}
    >
      Log out
    </button>
  </>;
}

export default function Profile() {
  const { data: session, status } = useSession()
  return (
    <Layout pageTitle={"Profile"}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <div className={styles.profileWrapper}>
        <UserInfo session={session} status={status}/>
      </div>
    </Layout>
  );
}
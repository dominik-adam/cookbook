import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';
import { useSession } from "next-auth/react"
import { signIn, signOut } from "next-auth/react"

function UserInfo({session, status}) {
  if (status !== "authenticated") {
    return (
      <p>Not signed in</p>
    );
  }

  return (
    <div className="warning">
      <p>Name: {session.user.name}</p>
      <p>Email: {session.user.email}</p>
      <p>Image: {session.user.image}</p>
      <p>Expires: {session.expires}</p>
    </div>
  );
}

export default function Profile() {
  const { data: session, status } = useSession()
  return (
    <Layout pageTitle={"Profile"}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <UserInfo session={session} status={status}/>
      <button onClick={() => signIn('google')}>Log in</button>
      <button onClick={() => signOut('google')}>Log out</button>
    </Layout>
  );
}
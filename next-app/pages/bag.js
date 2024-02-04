import Head from 'next/head';
import Layout, { siteTitle } from '../components/layout';

export default function ShoppingBag() {
  return (
    <Layout pageTitle={"Shopping Bag"}>
      <Head>
        <title>{siteTitle}</title>
      </Head>
    </Layout>
  );
}
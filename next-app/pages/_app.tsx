import '@/styles/global.css';
import { FlashMessageProvider } from '@/components/flashMessage/FlashMessageContext';
import { SessionProvider } from "next-auth/react"
import type { AppProps } from 'next/app'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <FlashMessageProvider>
       <Component {...pageProps} />
      </FlashMessageProvider>
    </SessionProvider>
  )
}

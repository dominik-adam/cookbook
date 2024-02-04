import '@/styles/global.css';
import { FlashMessageProvider } from '@/components/flashMessage/FlashMessageContext';
import { SessionProvider } from "next-auth/react"

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  return (
    <SessionProvider session={session}>
      <FlashMessageProvider>
       <Component {...pageProps} />
      </FlashMessageProvider>
    </SessionProvider>
  )
}
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        {/* Favicon from site */}
        <link rel="icon" href="https://podnbeyond.com/wp-content/uploads/2024/01/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="https://podnbeyond.com/wp-content/uploads/2024/01/favicon.ico" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://podnbeyond.com/wp-content/uploads/2024/01/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://podnbeyond.com/wp-content/uploads/2024/01/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
} 
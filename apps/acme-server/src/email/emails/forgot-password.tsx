import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from '@react-email/components'
import {
  btnContainer,
  codeText,
  container,
  h1,
  logo,
  main,
  paragraph,
  validityText,
  verificationSection,
  verifyText,
} from './css'

export interface TokenExpiryEmailProps {
  tokenId?: string
  expiresAt?: string // ISO string or formatted date
}

export function TokenExpiryEmail({ tokenId, expiresAt }: TokenExpiryEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your access token is about to expire soon</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            alt="acme"
            height="60"
            src={'https://zpgqhogoevbgpxustvmo.supabase.co/storage/v1/object/public/duck//placeholder%20(copy%201).png'}
            style={{ objectFit: 'contain', ...logo }}
            width="120"
          />

          <Section style={btnContainer}>
            <Heading style={h1}>Your Access Token is Expiring</Heading>
            <Text style={paragraph}>
              This is a reminder that your access token will expire soon. Please renew it to ensure uninterrupted access
              to your account and services.
            </Text>

            <Section style={{ placeContent: 'center', ...verificationSection }}>
              <Text style={verifyText}>Token ID</Text>
              <Text style={codeText}>{tokenId}</Text>
              <Text style={validityText}>Expires at: {expiresAt ? new Date(expiresAt).toLocaleString() : 'N/A'}</Text>
            </Section>
          </Section>

          <Hr />

          <Text style={paragraph}>
            Best,
            <br />
            The acme team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default TokenExpiryEmail

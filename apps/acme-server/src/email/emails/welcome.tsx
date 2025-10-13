import { Body, Button, Container, Head, Html, Img, Preview, Section, Text } from '@react-email/components'
import { btnContainer, button, container, logo, main, paragraph } from './css'

export interface WelcomeEmailProps {
  username: string
}

export function WelcomeEmail({ username }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>The acme platform that helps you uncover qualified leads.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            alt="acme"
            height="60"
            src={'https://zpgqhogoevbgpxustvmo.supabase.co/storage/v1/object/public/duck//placeholder%20(copy%201).png'}
            style={{ objectFit: 'cover', ...logo }}
            width="120"
          />
          <Text style={paragraph}>Hi {username},</Text>
          <Text style={paragraph}>
            Welcome to acme! Your account has been successfully created, and you're now ready to experience everything
            acme has to offer. Whether you're here to explore powerful tools, streamline your workflow, or unlock new
            opportunities, we're excited to have you with us. If you need any help getting started, our support team is
            always ready to assist. Let’s make something great together!
          </Text>
          <Section style={btnContainer}>
            <Button href="http://localhost:3000/dashboard/" style={button}>
              Get started
            </Button>
          </Section>

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

export default WelcomeEmail

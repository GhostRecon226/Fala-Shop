import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Fala Sun Style"
const SITE_URL = 'https://fala-sun-style.lovable.app'
const PRIMARY = '#592040'
const ACCENT = '#E8A88A'

interface CartReminderProps {
  customerName?: string
  itemCount?: number
}

const CartReminderEmail = ({ customerName, itemCount }: CartReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You left something behind at {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={brandHeading}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>
          {customerName ? `Hi ${customerName}, your cart is waiting` : 'Your cart is waiting'}
        </Heading>
        <Text style={text}>
          {itemCount && itemCount > 0
            ? `You have ${itemCount} item${itemCount === 1 ? '' : 's'} sitting in your cart at ${SITE_NAME}.`
            : `You started shopping with ${SITE_NAME} but didn't finish checking out.`}
        </Text>
        <Text style={text}>
          Pick up right where you left off — your selection is still saved for you.
        </Text>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button href={`${SITE_URL}/cart`} style={button}>
            Return to your cart
          </Button>
        </Section>
        <Text style={footer}>
          If you've already completed your purchase, please ignore this email.
        </Text>
        <Text style={footer}>— The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CartReminderEmail,
  subject: 'You left something in your cart',
  displayName: 'Cart reminder',
  previewData: { customerName: 'Jane', itemCount: 2 },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px', maxWidth: '560px' }
const headerSection = { padding: '8px 0' }
const brandHeading = { fontSize: '20px', fontWeight: 'bold', color: PRIMARY, margin: 0 }
const divider = { borderColor: '#eeeeee', margin: '12px 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold', color: '#111111', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 14px' }
const button = {
  backgroundColor: PRIMARY,
  color: '#ffffff',
  padding: '12px 24px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: 'bold',
  textDecoration: 'none',
  display: 'inline-block',
  borderTop: `2px solid ${ACCENT}`,
}
const footer = { fontSize: '12px', color: '#999999', margin: '24px 0 0' }

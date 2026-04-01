import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Fala Sun Style"

// Primary: hsl(325, 51%, 23%) ≈ #592040
// Accent: hsl(15, 76%, 77%) ≈ #E8A88A
const PRIMARY = '#592040'
const ACCENT = '#E8A88A'

interface OrderConfirmationProps {
  orderId?: string
  total?: string
  customerName?: string
}

const OrderConfirmationEmail = ({ orderId, total, customerName }: OrderConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your order with {SITE_NAME} has been confirmed!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={brandHeading}>{SITE_NAME}</Heading>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>
          {customerName ? `Thank you, ${customerName}!` : 'Thank you for your order!'}
        </Heading>
        <Text style={text}>
          Your payment has been confirmed and your order is now being processed.
        </Text>
        {orderId && (
          <Section style={orderBox}>
            <Text style={orderLabel}>Order ID</Text>
            <Text style={orderValue}>{orderId}</Text>
          </Section>
        )}
        {total && (
          <Section style={orderBox}>
            <Text style={orderLabel}>Total</Text>
            <Text style={orderValue}>₦{total}</Text>
          </Section>
        )}
        <Text style={text}>
          We'll notify you when your order ships. If you have any questions, feel free to reach out to us.
        </Text>
        <Hr style={divider} />
        <Text style={footer}>
          Best regards,<br />The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) =>
    data.orderId ? `Order Confirmed — ${data.orderId.slice(0, 8)}` : 'Your Order is Confirmed!',
  displayName: 'Order confirmation',
  previewData: { orderId: 'abc12345-6789', total: '25,000', customerName: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '520px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, padding: '20px 0 10px' }
const brandHeading = { fontSize: '20px', fontWeight: '700' as const, color: PRIMARY, margin: '0', letterSpacing: '0.5px' }
const divider = { borderColor: ACCENT, margin: '16px 0' }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const orderBox = { backgroundColor: '#faf5f7', borderRadius: '8px', padding: '12px 16px', marginBottom: '12px' }
const orderLabel = { fontSize: '11px', color: '#888', textTransform: 'uppercase' as const, margin: '0 0 4px', letterSpacing: '0.5px' }
const orderValue = { fontSize: '16px', fontWeight: '600' as const, color: PRIMARY, margin: '0' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }

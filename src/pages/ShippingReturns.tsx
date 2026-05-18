import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqs = [
  {
    value: 'shipping-rates',
    title: 'Shipping Rates',
    content:
      'Standard shipping is calculated at checkout based on your location and order weight. Orders over ₦100,000 qualify for free standard shipping within Nigeria.',
  },
  {
    value: 'delivery-times',
    title: 'Delivery Times',
    content:
      'Standard delivery takes 3–7 business days within Nigeria. Express delivery (1–3 business days) is available at checkout for an additional fee. Delivery times may vary during peak periods.',
  },
  {
    value: 'international-shipping',
    title: 'International Shipping',
    content:
      'We currently ship to select countries in West Africa. International orders typically arrive within 7–14 business days. Import duties and taxes are the responsibility of the buyer.',
  },
  {
    value: 'return-policy',
    title: 'Return Policy',
    content:
      'Items may be returned within 14 days of delivery in their original, unused condition with all tags attached. Solar hardware must be unopened and in its original packaging to qualify for a return.',
  },
  {
    value: 'refund-process',
    title: 'Refund Process',
    content:
      "Once we receive and inspect your return, refunds are processed within 5 business days to your original payment method. You'll receive an email confirmation when your refund has been issued.",
  },
  {
    value: 'exchanges',
    title: 'Exchanges',
    content:
      "Need a different size or colour? Contact us within 14 days of delivery and we'll arrange an exchange at no extra shipping cost (subject to stock availability).",
  },
];

const ShippingReturns = () => {
  return (
    <div className="container py-16 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
        Shipping & Returns
      </h1>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq) => (
          <AccordionItem key={faq.value} value={faq.value}>
            <AccordionTrigger>{faq.title}</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground leading-relaxed text-pretty">{faq.content}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ShippingReturns;

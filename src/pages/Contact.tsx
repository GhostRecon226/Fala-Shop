import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, Phone } from 'lucide-react';

const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().email('Invalid email address').max(255),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  message: z.string().trim().min(1, 'Message is required').max(2000),
});

type ContactValues = z.infer<typeof contactSchema>;

const Contact = () => {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: '', email: '', subject: '', message: '' },
  });

  const onSubmit = async (values: ContactValues) => {
    setSubmitting(true);
    const { error } = await supabase.from('contact_messages').insert(values);
    setSubmitting(false);

    if (error) {
      toast({ title: 'Something went wrong', description: 'Please try again later.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Message sent', description: "We'll get back to you soon." });
    form.reset();
  };

  return (
    <div className="container py-16 max-w-4xl">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">Contact Us</h1>

      <div className="grid md:grid-cols-5 gap-12">
        <div className="md:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Your name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="you@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl><Input placeholder="What's this about?" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="message" render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl><Textarea placeholder="Your message…" rows={5} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? 'Sending…' : 'Send Message'}
              </Button>
            </form>
          </Form>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">Get in Touch</h2>
            <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
              Have a question about an order, product, or partnership? Reach out and we'll
              respond within 24 hours.
            </p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>support@falaproduction.com</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>+234 800 000 0000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

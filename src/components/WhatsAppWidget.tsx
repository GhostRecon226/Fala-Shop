const WHATSAPP_NUMBER = '2349066064421';
const MESSAGE = "Hi Fala Production! I'd like to make an enquiry.";

const WhatsAppWidget = () => {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-8 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform hover:scale-110 hover:bg-[#1ebe57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366] md:bottom-6 md:right-6 md:h-14 md:w-14"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.495-1.318.115-.272.158-.57.158-.872 0-.812-.515-.948-1.235-1.32-.058-.03-.116-.058-.174-.087Z"/>
        <path d="M26.733 5.157a14.93 14.93 0 0 0-10.59-4.4C7.88.757 1.158 7.48 1.158 15.743c0 2.644.687 5.214 2.005 7.487L1.03 30.99l7.94-2.082a14.91 14.91 0 0 0 7.157 1.82h.006c8.265 0 14.987-6.722 14.99-14.987a14.93 14.93 0 0 0-4.39-10.585Zm-10.59 23.05h-.005a12.42 12.42 0 0 1-6.337-1.736l-.455-.27-4.71 1.236 1.257-4.595-.297-.47A12.4 12.4 0 0 1 3.7 15.743c0-6.86 5.585-12.444 12.45-12.444 3.324 0 6.448 1.296 8.797 3.65a12.36 12.36 0 0 1 3.642 8.802c-.002 6.866-5.587 12.45-12.446 12.45Z"/>
      </svg>
    </a>
  );
};

export default WhatsAppWidget;

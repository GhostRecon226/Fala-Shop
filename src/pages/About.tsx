const About = () => {
  return (
    <div className="container py-16 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">
        About Fala Production Ltd.
      </h1>

      <p className="text-muted-foreground leading-relaxed text-pretty mb-8">
        Fala Production Ltd. is where engineered utility meets refined style. We design and
        curate products that solve real problems — from solar-powered hardware built for
        off-grid living to everyday lifestyle essentials crafted with intention.
      </p>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">What We Offer</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Solar fans and renewable energy accessories</li>
            <li>Clothing designed for comfort and durability</li>
            <li>Sneakers that balance performance with everyday wear</li>
            <li>Bags built for function and style</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Our Values</h2>
          <p className="text-muted-foreground leading-relaxed text-pretty">
            Quality over quantity. Every product in our catalogue is chosen — or built —
            because it earns its place. We believe good design should be accessible, durable
            goods should be the norm, and sustainable technology shouldn't feel like a
            compromise.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;

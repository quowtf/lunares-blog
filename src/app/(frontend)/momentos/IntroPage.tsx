export function IntroPage() {
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="about-heading" className="flex flex-col gap-6">
        <h2
          id="about-heading"
          className="font-display text-2xl font-light tracking-tight text-foreground sm:text-3xl"
        >
          Sobre Lunares.mx
        </h2>
        <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>Es el librero de trofeos en la sala o la vitrina de recuerdos en el comedor.</p>
          <p>Es ese sentido de presencia digital, pertenencia simbólica y un espacio con espacio.</p>
          <p>Sobre todo, es un acto de rebeldía hacia el algoritmo, que a la fecha me incomoda.</p>
        </div>
      </section>

      <section aria-labelledby="content-heading" className="flex flex-col gap-6">
        <h2
          id="content-heading"
          className="font-display text-2xl font-light tracking-tight text-foreground sm:text-3xl"
        >
          Qué encontrarás aquí
        </h2>
        <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>Exactamente en esta página, deberías ver fotos que expiran en 24hrs.</p>
          <p>
            Si estás leyendo esto, vuelve otro día y tal vez tengas suerte.
          </p>
        </div>
      </section>
    </div>
  )
}

export function IntroPage() {
  return (
    <div className="flex flex-col gap-10">
      <section aria-labelledby="about-heading" className="flex flex-col gap-6">
        <h2
          id="about-heading"
          className="font-display text-2xl font-light tracking-tight text-foreground sm:text-3xl"
        >
          Sobre este espacio
        </h2>
        <div className="flex flex-col gap-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>Es el librero de trofeos en la sala o la vitrina de recuerdos en el comedor.</p>
          <p>Es ese sentido de presencia digital, pertenencia simbólica, un espacio con espacio.</p>
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
          <p>Un humano, una persona, un devoto, un creyente, un buscador de palabras.</p>
          <p>
            Busco palabras en libros, para usarlas en contextos indebidos y de formas incorrectas.
          </p>
          <p>Espero no intimidarte, tanto, y que sepas que puedes volver aquí cuando gustes.</p>
        </div>
      </section>
    </div>
  )
}

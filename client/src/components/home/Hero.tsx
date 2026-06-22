const HERO_IMAGE = "/hero.jpg"

function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative aspect-[16/9] w-full sm:aspect-[16/7]">
        <img
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <h1 className="select-none text-center font-sans text-[18vw] font-black uppercase leading-none tracking-tight text-white/85 drop-shadow-[0_4px_20px_rgba(0,0,0,0.35)] sm:text-[16vw] lg:text-[180px]">
            Amerika
          </h1>
        </div>
        <div className="absolute bottom-3 right-4 select-none text-2xl font-bold tracking-wider text-white/90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] sm:bottom-4 sm:right-6 sm:text-3xl lg:text-4xl">
          2026
        </div>
      </div>
    </section>
  )
}

export default Hero

import type { BodyId } from "./types";

export interface PlanetInfo {
  summary: string;
  facts: string[];
}

export const PLANET_INFO: Record<BodyId, PlanetInfo | null> = {
  sun: {
    summary: "The star that anchors the entire solar system.",
    facts: [
      "Holds about 99.8 percent of solar system mass.",
      "Surface temperature is about 5,500 C.",
      "Solar wind shapes the heliosphere."
    ]
  },
  mercury: {
    summary: "A fast, rocky world with extreme temperatures.",
    facts: [
      "Smallest planet in the solar system.",
      "A day here is longer than its year.",
      "Has no substantial atmosphere."
    ]
  },
  venus: {
    summary: "A hot, cloud-covered planet with a dense atmosphere.",
    facts: [
      "Hottest surface temperature of any planet.",
      "Rotates backward and very slowly.",
      "Surface pressure is about 92x Earth."
    ]
  },
  earth: {
    summary: "The only known planet with surface liquid water.",
    facts: [
      "Active plate tectonics reshape the surface.",
      "One large moon stabilizes the tilt.",
      "Oxygen-rich atmosphere supports life."
    ]
  },
  moon: {
    summary: "Earth's only natural satellite, modulating ocean tides and stabilizing Earth's axial tilt.",
    facts: [
      "Fifth-largest moon in the solar system.",
      "Tidally locked to Earth, showing only one side.",
      "The only celestial body beyond Earth visited by humans."
    ]
  },
  mars: {
    summary: "A cold desert world with a thin atmosphere.",
    facts: [
      "Home to Olympus Mons, the tallest volcano.",
      "Polar ice caps expand and shrink seasonally.",
      "Evidence of ancient rivers and lakes."
    ]
  },
  jupiter: {
    summary: "The largest planet, wrapped in storms and bands.",
    facts: [
      "Great Red Spot is a centuries-old storm.",
      "Has a powerful magnetic field.",
      "Dozens of moons, including Europa and Io."
    ]
  },
  io: {
    summary: "The innermost Galilean moon of Jupiter and the most volcanically active body in the solar system.",
    facts: [
      "Features over 400 active volcanoes driven by intense tidal heating.",
      "Plumes of sulfur and sulfur dioxide shoot hundreds of kilometers into space.",
      "Lacks impact craters due to continuous volcanic resurfacing."
    ]
  },
  europa: {
    summary: "An icy Galilean moon harboring a vast subsurface liquid ocean beneath its frozen crust.",
    facts: [
      "Subsurface ocean holds more water than all of Earth's oceans combined.",
      "Surface crisscrossed by linear fractures and chaotic terrain.",
      "Prime candidate in the search for extraterrestrial habitability."
    ]
  },
  ganymede: {
    summary: "The largest moon in the solar system, even exceeding the planet Mercury in diameter.",
    facts: [
      "Only known moon in the solar system to possess its own intrinsic magnetic field.",
      "Features a complex mix of ancient dark cratered terrain and younger grooved regions.",
      "Harbors an underground saltwater ocean sandwiched between ice layers."
    ]
  },
  callisto: {
    summary: "The outermost Galilean moon, bearing the most heavily cratered surface in the solar system.",
    facts: [
      "Ancient surface has remained largely unaltered for four billion years.",
      "Lacks significant tidal heating due to its orbital distance from Jupiter.",
      "Features giant multiring impact structures like the Valhalla basin."
    ]
  },
  saturn: {
    summary: "Known for its bright rings of ice and rock.",
    facts: [
      "Rings are thin but span huge distances.",
      "Less dense than water.",
      "Titan has a thick atmosphere."
    ]
  },
  enceladus: {
    summary: "Saturn's dazzling ocean moon, coated in pure water ice and venting cryovolcanic geysers into space.",
    facts: [
      "One of the most reflective bodies in the solar system, reflecting nearly 100% of sunlight.",
      "Cassini flybys photographed famous 'tiger stripe' fractures venting plumes into Saturn's E ring.",
      "A warm global subsurface ocean with hydrothermal activity lies beneath its icy shell."
    ]
  },
  titan: {
    summary: "Saturn's giant moon enveloped in a dense nitrogen atmosphere with lakes of liquid hydrocarbons.",
    facts: [
      "The only moon with a substantial, dense atmosphere and active liquid cycle.",
      "Atmospheric surface pressure is approximately 1.5 times that of Earth.",
      "Host to dunes, rivers, rain, and seas composed of liquid methane and ethane."
    ]
  },
  uranus: {
    summary: "An ice giant tipped almost on its side.",
    facts: [
      "Axial tilt is about 98 degrees.",
      "Methane gives it a blue-green hue.",
      "Has faint rings and icy moons."
    ]
  },
  titania: {
    summary: "The largest moon of Uranus, marked by prominent rift canyons and impact craters.",
    facts: [
      "Cut by massive fault grabens spanning hundreds of kilometers.",
      "Composed of approximately equal parts water ice and dense rock.",
      "May possess a thin layer of liquid water at its core-mantle boundary."
    ]
  },
  oberon: {
    summary: "The outermost major moon of Uranus, heavily cratered and dusted with dark carbonaceous material.",
    facts: [
      "Shows evidence of ancient tectonic fault scarps across its crust.",
      "Features an enigmatic mountain rising roughly 11 km above the surrounding plains.",
      "Second-largest Uranian moon and the most heavily cratered."
    ]
  },
  neptune: {
    summary: "A deep-blue ice giant with fierce winds.",
    facts: [
      "Fastest winds in the solar system.",
      "Color comes from methane absorption.",
      "Has large moon Triton."
    ]
  },
  triton: {
    summary: "The largest moon of Neptune and a captured Kuiper belt dwarf planet orbiting in retrograde.",
    facts: [
      "The only large moon in the solar system with a retrograde orbit.",
      "Active nitrogen cryogeysers vent dark material into its tenuous atmosphere.",
      "Features distinctive cantaloupe terrain formed by diaperic ice tectonics."
    ]
  },
  ceres: {
    summary: "A dwarf planet in the asteroid belt.",
    facts: [
      "Largest object in the asteroid belt.",
      "Likely has a briny interior.",
      "Bright salt deposits on its surface."
    ]
  },
  pluto: {
    summary: "A distant dwarf planet in the Kuiper belt.",
    facts: [
      "Binary system with its moon Charon.",
      "Highly elliptical and inclined orbit.",
      "Surface has nitrogen and methane ice."
    ]
  },
  charon: {
    summary: "Pluto's massive companion moon, forming a mutually tidally locked binary system.",
    facts: [
      "Over half the diameter of Pluto, making the pair a double dwarf planet system.",
      "Features Mordor Macula, a reddish-brown tholin cap at its north pole.",
      "Home to Serenity Chasma, a tectonic canyon four times deeper than the Grand Canyon."
    ]
  },
  voyager1: {
    summary: "NASA's interstellar probe launched in 1977, currently exploring space beyond the heliosphere.",
    facts: [
      "Farthest human-made object from Earth (~171.5 AU).",
      "Entered interstellar space on August 25, 2012.",
      "Carries the Golden Record with sounds and images of Earth."
    ]
  }
};

import bg1 from "../assets/backgrounds/game-bg-1.jpg";
import bg2 from "../assets/backgrounds/game-bg-3.jpg";
import bg3 from "../assets/backgrounds/menu-bg-2.jpg";

const backgrounds = [bg1.src, bg2.src, bg3.src];

export const backgroundsscroll = () =>
  backgrounds[Math.floor(Math.random() * backgrounds.length)];

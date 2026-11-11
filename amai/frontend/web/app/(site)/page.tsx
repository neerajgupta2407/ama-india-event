import type { Metadata } from "next";

import About from "@/components/conference/About";
import Celebration50 from "@/components/conference/Celebration50";
import ConferenceGlance from "@/components/conference/ConferenceGlance";
import Contact from "@/components/conference/Contact";
import Countdown from "@/components/conference/Countdown";
import Gallery from "@/components/conference/Gallery";
import Hero from "@/components/conference/Hero";
import Organisations from "@/components/conference/Organisations";
import Participate from "@/components/conference/Participate";
import Programme from "@/components/conference/Programme";
import RegistrationFees from "@/components/conference/RegistrationFees";
import RoomReservation from "@/components/conference/RoomReservation";
import Themes from "@/components/conference/Themes";
import Venue from "@/components/conference/Venue";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function HomePage() {
  return (
    <>
      <Hero />
      <Countdown />
      <About />
      <ConferenceGlance />
      <Themes />
      <Programme />
      <Participate />
      <Organisations />
      <RegistrationFees />
      <Gallery />
      <RoomReservation />
      <Venue />
      <Contact />
      <Celebration50 />
    </>
  );
}

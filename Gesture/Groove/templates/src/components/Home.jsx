import React from "react";
import { Play, HandMetal } from "lucide-react";
import { motion } from "framer-motion";
import AnchorLink from "react-anchor-link-smooth-scroll";

const Home = ({ setSelectedPage }) => {
  return (
    <section
      id="home"
      className="md:flex md:justify-between md:items-center gap-16 md:h-full py-10 bg-gradient-to-b from-emerald-900 to-green-800"
    >
      {/* IMAGE SECTION */}
      <div className="basis-3/5 z-10 mt-1 md:mt-8 flex justify-center md:order-2">
        <div className="relative z-0 w-full max-w-[400px] md:max-w-[600px]">
          <HandMetal className="w-40 h-40 text-green-400 mb-8 mx-auto md:mx-0" />
        </div>
      </div>

      {/* MAIN TEXT */}
      <div className="z-30 basis-2/5 mt-12 md:mt-32">
        {/* HEADINGS */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          variants={{
            hidden: { opacity: 0, x: -50 },
            visible: { opacity: 1, x: 0 },
          }}
        >
          <h1 className="text-5xl font-extrabold text-white mb-6 tracking-wide">
            Welcome to <span className="text-green-400">GestureGroove</span>
          </h1>
          <p className="mt-10 mb-7 text-lg text-emerald-200 text-center md:text-start">
            Control your music hands-free with gesture recognition! Use intuitive hand movements to play, pause, and adjust volume. It’s simple, fast, and fun.
          </p>
        </motion.div>

        {/* CALL TO ACTIONS */}
        <motion.div
          className="flex mt-5 justify-center md:justify-start gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          variants={{
            hidden: { opacity: 0, x: -50 },
            visible: { opacity: 1, x: 0 },
          }}
        >
          <button
            className="flex items-center px-8 py-4 bg-green-500 text-white rounded-full font-bold shadow-lg hover:bg-green-600 hover:scale-105 transition-transform"
            onClick={() => setSelectedPage("gesture-control")}
          >
            <Play className="w-6 h-6 mr-3" />
            Start Using the App
          </button>
          <AnchorLink
            className="rounded-r-sm bg-gradient-to-r from-green-400 to-green-600 py-3 px-7 text-deep-blue font-semibold hover:bg-green-500 hover:text-white transition duration-500"
            href="#instructions"
            onClick={() => setSelectedPage("instructions")}
          >
            How It Works
          </AnchorLink>
        </motion.div>
      </div>
    </section>
  );
};

export default Home;

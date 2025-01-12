import React from 'react';
import { Hand, Volume2, Music, SunMedium } from 'lucide-react';

const Instructions = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8">How to Use GestureGroove</h2>
      
      <div className="space-y-8">
        <InstructionCard
          icon={<Hand className="w-8 h-8 text-green-400" />}
          title="Pinch Gesture"
          description="Bring your thumb and index finger together to play or pause your music. Keep your hand steady and visible to the camera."
        />
        
        <InstructionCard
          icon={<Volume2 className="w-8 h-8 text-green-400" />}
          title="Volume Control"
          description="Raise your hand to increase volume, lower it to decrease. Use slow, deliberate movements for better control."
        />
        
        <div className="bg-emerald-950/50 p-6 rounded-lg border border-emerald-800">
          <h3 className="text-xl font-semibold text-white mb-4">Tips for Better Recognition</h3>
          <ul className="space-y-4 text-emerald-300">
            <TipItem
              icon={<SunMedium className="w-5 h-5 text-green-400" />}
              text="Ensure good lighting - your hand should be clearly visible"
            />
            <TipItem
              icon={<Hand className="w-5 h-5 text-green-400" />}
              text="Keep your hand within the camera frame"
            />
            <TipItem
              icon={<Music className="w-5 h-5 text-green-400" />}
              text="Start with slow gestures until you're comfortable with the controls"
            />
          </ul>
        </div>
      </div>
    </div>
  );
};

const InstructionCard = ({ icon, title, description }) => (
  <div className="bg-emerald-900/50 p-6 rounded-lg border border-emerald-700">
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <h3 className="text-xl font-semibold text-green-400 mb-2">{title}</h3>
        <p className="text-emerald-300">{description}</p>
      </div>
    </div>
  </div>
);

const TipItem = ({ icon, text }) => (
  <li className="flex items-center space-x-3">
    <div className="flex-shrink-0">{icon}</div>
    <span>{text}</span>
  </li>
);

export default Instructions;
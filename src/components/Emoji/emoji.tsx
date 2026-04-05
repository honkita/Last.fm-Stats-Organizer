'use client';

// Props Types
interface emojiProps {
  text: string;
}

const Emoji = ({ text }: emojiProps) => {
  return <span className="emoji">{text}</span>;
};

export default Emoji;

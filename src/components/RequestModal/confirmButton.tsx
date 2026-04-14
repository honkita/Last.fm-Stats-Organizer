'use client';

// Chakra UI
import { Button } from '@chakra-ui/react';

interface ConfirmButtonProps {
  type: 'artist' | 'album' | 'other';
  submit: (type: 'artist' | 'album' | 'other') => void;
}

const ConfirmButton = ({ type, submit }: ConfirmButtonProps) => {
  return (
    <Button
      onClick={() => submit(type)}
      backgroundColor="brand.primaryAccent"
      width="100%"
    >
      Submit Request
    </Button>
  );
};

export default ConfirmButton;

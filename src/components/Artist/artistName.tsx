import { useAccordionItemContext, Text } from "@chakra-ui/react";

interface ArtistNameProps {
   name: string;
   rank: number;
}

const ArtistName = ({ name, rank }: ArtistNameProps) => {
   const item = useAccordionItemContext();

   const expanded = item?.expanded;

   return (
      <Text
         fontWeight="semibold"
         title={name}
         minW={0}
         maxW="100%"
         overflow={expanded ? "visible" : "hidden"}
         textOverflow={expanded ? "clip" : "ellipsis"}
         whiteSpace={expanded ? "normal" : "nowrap"}
      >
         {rank}. {name}
      </Text>
   );
};

export default ArtistName;

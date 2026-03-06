import { useAccordionItemContext, Text } from "@chakra-ui/react";

const ArtistName = ({ name }: { name: string }) => {
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
         {name}
      </Text>
   );
};

export default ArtistName;

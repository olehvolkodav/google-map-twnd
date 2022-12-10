import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from "framer-motion";

import DetailPopup from '../DetailPopup';
import Header from '../Header';
import { slideLeft } from '../../utils/animation';

export default function DetailModal({}) {
  const { selectedLocation, detailLocation } = useSelector(
    (state) => state.home,
  );

  const isOpen = !!selectedLocation?.id;

  return (
    <>
      {
        isOpen && (
          <AnimatePresence exitBeforeEnter={false}>
            <motion.div
              key={slideLeft.name}
              className="absolute z-30"
              variants={slideLeft.variants}
              transition={slideLeft.transition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="min-h-full min-w-full overflow-y-auto">
                {!detailLocation && <Header isDetailModal />}
                {!!selectedLocation && <DetailPopup />}
              </div>
            </motion.div>
          </AnimatePresence>
        )
      }
    </>
  );
}

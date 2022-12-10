import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import 'react-circular-progressbar/dist/styles.css';

import { ReactComponent as IconClose } from '../../assets/images/close.svg';
import { ReactComponent as IconLocation } from '../../assets/images/location.svg';

import DataContext from '../../contexts.js';
import { closeLocation } from '../../features/home/homeSlice';

import OccupancyPieChart from '../OccupancyPieChart';
import PopularTimesChart from '../PopularTimesChart';
import OccupancyLabel from '../OccupancyLabel';

import './index.css';

function DetailPopup() {
  const dataContext = useContext(DataContext);

  const dispatch = useDispatch();
  const { selectedLocation, isMobile } = useSelector((state) => state.home);
  const {
    title,
    description,
    imageUrl,
    popularTimes = [],
    location: address,
  } = selectedLocation || {};

  const wrapperClasses = classNames(
    'md:rounded max-w-md font-default bottom-0 max-h-full overflow-y-auto md:top-[4vh] md:left-[52vw] left-0 w-full pt-[105px]',
    { 'bg-[#F7F7F7]': isMobile },
    { 'bg-white': !isMobile },
  );

  return (
    <div className={wrapperClasses}>
      <div className="relative md:!block">
        <div className="w-full rounded">
          <LazyLoadImage
            alt="detail-header"
            effect="blur"
            src={imageUrl}
          />
        </div>
        <button
          type="button"
          className="absolute hidden top-2 right-2 rounded-full w-8 h-8 bg-black shadow-md md:block"
          onClick={() => dispatch(closeLocation())}
        >
          <IconClose />
        </button>
      </div>
      <div className="p-6 md:p-6">
        <div className="relative">
          <div className="flex align-center">
            <div className="flex flex-auto flex-col items-start pr-8">
              <h2 className="text-lg font-bold text-black leading-8 md:text-xl">
                {title || ''}
              </h2>
              <p className="text-xl">{address?.city || ''}</p>
            </div>
            {!isMobile && (
              <div className="w-[90px] h-[90px] ml-4 md:min-w-[90px]">
                <OccupancyPieChart location={selectedLocation} />
              </div>
            )}
            {isMobile && selectedLocation?.location?.mapsLink && (
              <div className="flex flex-auto justify-end">
                <a href={selectedLocation?.location?.mapsLink} target="_blank">
                  <IconLocation
                    className="top-3 right-3"
                    style={{ color: dataContext?.branding?.primaryColor }}
                  />
                </a>
              </div>
            )}
          </div>
          <p className="mt-4 text-[#111111] text-sm md:block">
            {description?.[dataContext.language] || description?.de}
          </p>
          <div className="mt-4 md:hidden">
            <OccupancyLabel location={selectedLocation} />
          </div>
        </div>
      </div>
      <div className="p-6 bg-white md:block">
        <PopularTimesChart popularTimes={popularTimes} />
      </div>
    </div>
  );
}

export default DetailPopup;

import React, { useMemo, useState } from 'react';
import classNames from 'classnames';
import { useSelector } from 'react-redux';

import { selectIsListView } from '../../features/home/homeSlice';

import LocationList from '../LocationList';
import LocationSearch from '../LocationSearch';
import Header from '../Header';

function LocationsSidebar({ locations }) {
  const isListView = useSelector(selectIsListView);
  const isHidden = !isListView;

  const [isLowOccupancyVisible, setIsLowOccupancyVisible] = useState(false);
  const [searchQuery, setQuery] = useState('');

  const filteredLocations = useMemo(
    () =>
      locations.filter(
        ({ spaceId, relativeOccupancy }) =>
          spaceId.includes(searchQuery) &&
          (!isLowOccupancyVisible ||
            (isLowOccupancyVisible && relativeOccupancy < 85)),
      ),
    [locations, searchQuery, isLowOccupancyVisible],
  );

  return (
    <div
      className={classNames(
        'w-screen z-10 md:fixed md:inset-y-0 md:flex md:w-1/3 md:flex-col md:min-w-[330px]',
        isHidden ? 'hidden md:block' : 'block',
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
        <div className="flex flex-1 flex-col max-h-screen min-h-screen overflow-hidden">
          <Header />
          <LocationSearch
            isLowOccupancyVisible={isLowOccupancyVisible}
            searchQuery={searchQuery}
            setIsLowOccupancyVisible={setIsLowOccupancyVisible}
            setQuery={setQuery}
          />
          <LocationList locations={filteredLocations} />
        </div>
      </div>
    </div>
  );
}

export default LocationsSidebar;

import { useContext } from 'react';

import DataContext from '../../contexts.js';
import SearchSvg from '../../assets/images/search.svg';

import Toggle from '../../components/Toggle';

function LocationSearch({
  isLowOccupancyVisible,
  searchQuery,
  setIsLowOccupancyVisible,
  setQuery,
}) {
  const dataContext = useContext(DataContext);

  return (
    <form className="bg-white dark:bg-white shadow-sm px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <p className="text-[#595959] text-lg font-display pr-2">
          {dataContext?.translations?.['low-occupancy-toggle'] || ''}
        </p>
        <Toggle
          checked={isLowOccupancyVisible}
          setChecked={setIsLowOccupancyVisible}
        />
      </div>
      <div className="relative bg-white dark:bg-white">
        <div className="flex absolute inset-y-0 right-3 items-center pl-3 pointer-events-none">
          <img src={SearchSvg} alt="search" />
        </div>
        <input
          type="search"
          id="default-search"
          className="block pl-5 pr-10 py-2 w-full text-base bg-white rounded border border-[#D9D9D9] font-display focus:ring-blue-500  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder={dataContext?.translations?.['search-placeholder']}
          value={searchQuery}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </form>
  );
}

export default LocationSearch;

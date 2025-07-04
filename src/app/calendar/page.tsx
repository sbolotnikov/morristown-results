"use client"
import React, { useState, useRef, FC } from 'react';

// --- Type Definitions ---

interface SVGConfig {
  MONTH_WIDTH: number;
  MONTH_HEIGHT: number;
  PADDING: number;
  HEADER_HEIGHT: number;
  DAY_HEADER_HEIGHT: number;
  CELL_WIDTH: number;
  CELL_HEIGHT: number;
  YEAR_TITLE_FONT_SIZE: number;
  MONTH_FONT_SIZE: number;
  DAY_HEADER_FONT_SIZE: number;
  DAY_NUMBER_FONT_SIZE: number;
  MONTHS_PER_ROW: number;
  MONTH_ROW_GAP: number;
  MONTH_COL_GAP: number;
  MAIN_TITLE_AREA_HEIGHT: number;
}

interface Colors {
  DEFAULT: string;
  WEEKEND: string;
  BLACK: string;
  RED: string;
  GREEN: string;
  BLUE: string;
}

type StartDay = 'Su' | 'Mo';
type DateColors = Record<string, string>;

interface MonthGraphicsProps {
  month: number;
}

interface MonthCalendarProps {
  year: number;
  month: number;
  startDay: StartDay;
  highlightWeekends: boolean;
  dateColors: DateColors;
  onDateClick: (dateKey: string) => void;
}

// --- Configuration Constants ---

const SVG_CONFIG: SVGConfig = {
  MONTH_WIDTH: 300,
  MONTH_HEIGHT: 280,
  PADDING: 20,
  HEADER_HEIGHT: 40,
  DAY_HEADER_HEIGHT: 20,
  CELL_WIDTH: 40,
  CELL_HEIGHT: 30,
  YEAR_TITLE_FONT_SIZE: 36,
  MONTH_FONT_SIZE: 20,
  DAY_HEADER_FONT_SIZE: 12,
  DAY_NUMBER_FONT_SIZE: 14,
  MONTHS_PER_ROW: 3,
  MONTH_ROW_GAP: 20,
  MONTH_COL_GAP: 20,
  MAIN_TITLE_AREA_HEIGHT: 80,
};

const COLORS: Colors = {
  DEFAULT: '#333',
  WEEKEND: '#D32F2F',
  BLACK: '#333',
  RED: '#D32F2F',
  GREEN: '#388E3C',
  BLUE: '#1976D2',
};

const COLOR_CYCLE: string[] = [COLORS.DEFAULT, COLORS.RED, COLORS.GREEN, COLORS.BLUE];

// --- Helper Functions & Components ---

/**
 * Renders a subtle background graphic for a given month.
 */
const MonthGraphics: FC<MonthGraphicsProps> = ({ month }) => {
  const graphics: JSX.Element[] = [
    // 0: Jan - Snowflake
    <path d="M150 125 l0 100 M100 175 l100 0 M115 140 l70 70 M115 210 l70 -70" stroke="#000" strokeWidth="2" />,
    // 1: Feb - Heart
    <path d="M150 165 c-20-50 -70-30 -50 0 c20-30 80-30 50 0" fill="none" stroke="#000" strokeWidth="2" />,
    // 2: Mar - Sprout
    <path d="M150 200 q-20 -40 0 -80 q20 40 0 80 M140 160 c-10-10-20 0-10 10 M160 160 c10-10 20 0 10 10" fill="none" stroke="#000" strokeWidth="2" />,
    // 3: Apr - Cloud & Rain
    <g stroke="#000" strokeWidth="2" fill="none"><path d="M120 160 q-20-30 10-40 q30 0 30 20 q40 0 30 30 z" /><path d="M130 190 l0 10 M150 195 l0 10 M170 190 l0 10" /></g>,
    // 4: May - Flower
    <g stroke="#000" strokeWidth="2" fill="none"><circle cx="150" cy="175" r="15" /><path d="M150 155 a20,20 0 0,1 0,40 a20,20 0 0,1 0,-40" /><path d="M132 165 a20,20 0 0,1 36,20 a20,20 0 0,1 -36,-20" /><path d="M132 185 a20,20 0 0,1 36,-20 a20,20 0 0,1 -36,20" /></g>,
    // 5: Jun - Sun
    <g stroke="#000" strokeWidth="2" fill="none"><circle cx="150" cy="175" r="25" /><path d="M150 130 l0 15 M150 220 l0 -15 M110 175 l15 0 M190 175 l-15 0 M120 145 l10 10 M180 205 l-10 -10 M120 205 l10 -10 M180 145 l-10 10" /></g>,
    // 6: Jul - Star
    <path d="M150 140 l20 40 l40 -10 l-30 30 l10 40 l-40 -20 l-40 20 l10 -40 l-30 -30 l40 10 z" stroke="#000" strokeWidth="2" fill="none" />,
    // 7: Aug - Sun
    <g stroke="#000" strokeWidth="2" fill="none"><circle cx="150" cy="175" r="25" /><path d="M150 130 l0 15 M150 220 l0 -15 M110 175 l15 0 M190 175 l-15 0 M120 145 l10 10 M180 205 l-10 -10 M120 205 l10 -10 M180 145 l-10 10" /></g>,
    // 8: Sep - Leaf
    <path d="M140 140 q50 50 10 70 q-40 -20 -10 -70 M150 210 q-20-20 0-60" stroke="#000" strokeWidth="2" fill="none" />,
    // 9: Oct - Pumpkin
    <g stroke="#000" strokeWidth="2" fill="none"><rect x="145" y="140" width="10" height="15" /><ellipse cx="150" cy="185" rx="40" ry="30" /><path d="M150 155 c-20 20-20 40 0 60 M150 155 c20 20 20 40 0 60" /></g>,
    // 10: Nov - Leaf
    <path d="M160 140 q-50 50 -10 70 q40 -20 10 -70 M150 210 q20-20 0-60" stroke="#000" strokeWidth="2" fill="none" />,
    // 11: Dec - Snowflake
    <path d="M150 125 l0 100 M100 175 l100 0 M115 140 l70 70 M115 210 l70 -70" stroke="#000" strokeWidth="2" />,
  ];

  return <g opacity="0.08" transform="scale(0.8) translate(38, 38)">{graphics[month]}</g>;
};

/**
 * A single month's calendar component, handling all display logic.
 */
const MonthCalendar: FC<MonthCalendarProps> = ({ year, month, startDay, highlightWeekends, dateColors, onDateClick }) => {
  const monthNames: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const allDayNames: Record<string, string> = { Su: "Su", Mo: "Mo", Tu: "Tu", We: "We", Th: "Th", Fr: "Fr", Sa: "Sa" };
  
  const dayNames: string[] = startDay === 'Su' 
    ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] 
    : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const firstDayOfWeek: number = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon, ...
  const startingCol: number = startDay === 'Su' ? firstDayOfWeek : (firstDayOfWeek + 6) % 7;
  const daysInMonth: number = new Date(year, month + 1, 0).getDate();

  const renderDays = (): JSX.Element[] => {
    const dayElements: JSX.Element[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date: Date = new Date(year, month, day);
      const dayOfWeek: number = date.getDay(); // 0=Sun, 6=Sat
      const dateKey: string = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const col: number = startDay === 'Su' ? dayOfWeek : (dayOfWeek + 6) % 7;
      const row: number = Math.floor((startingCol + day - 1) / 7);

      const x: number = SVG_CONFIG.PADDING + col * SVG_CONFIG.CELL_WIDTH + SVG_CONFIG.CELL_WIDTH / 2;
      const y: number = SVG_CONFIG.PADDING + SVG_CONFIG.HEADER_HEIGHT + SVG_CONFIG.DAY_HEADER_HEIGHT + row * SVG_CONFIG.CELL_HEIGHT + SVG_CONFIG.CELL_HEIGHT / 2;

      let color: string = dateColors[dateKey] || COLORS.DEFAULT;
      if (!dateColors[dateKey] && highlightWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        color = COLORS.WEEKEND;
      }
      
      dayElements.push(
        <text
          key={dateKey}
          x={x}
          y={y}
          fontSize={SVG_CONFIG.DAY_NUMBER_FONT_SIZE}
          textAnchor="middle"
          alignmentBaseline="middle"
          fontFamily="sans-serif"
          fill={color}
          onClick={() => onDateClick(dateKey)}
          style={{ cursor: 'pointer' }}
        >
          {day}
        </text>
      );
    }
    return dayElements;
  };

  return (
    <g>
      <MonthGraphics month={month} />
      <text x={SVG_CONFIG.MONTH_WIDTH / 2} y={SVG_CONFIG.PADDING + SVG_CONFIG.MONTH_FONT_SIZE / 2} fontSize={SVG_CONFIG.MONTH_FONT_SIZE} fontWeight="bold" textAnchor="middle" alignmentBaseline="middle" fontFamily="sans-serif" fill="#111">{monthNames[month]}</text>
      {dayNames.map((dayName, index) => {
        const isWeekend: boolean = dayName === 'Su' || dayName === 'Sa';
        return (
          <text key={index} x={SVG_CONFIG.PADDING + index * SVG_CONFIG.CELL_WIDTH + SVG_CONFIG.CELL_WIDTH / 2} y={SVG_CONFIG.PADDING + SVG_CONFIG.HEADER_HEIGHT} fontSize={SVG_CONFIG.DAY_HEADER_FONT_SIZE} textAnchor="middle" alignmentBaseline="middle" fontFamily="sans-serif" fill={highlightWeekends && isWeekend ? COLORS.WEEKEND : '#555'}>
            {allDayNames[dayName]}
          </text>
        );
      })}
      {renderDays()}
    </g>
  );
};

/**
 * Main application component.
 */
const page: FC<{}> = ({}) => {
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [highlightWeekends, setHighlightWeekends] = useState<boolean>(true);
  const [startDay, setStartDay] = useState<StartDay>('Su');
  const [dateColors, setDateColors] = useState<DateColors>({});
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const handleDateClick = (dateKey: string): void => {
    const currentColor: string = dateColors[dateKey] || COLORS.DEFAULT;
    const currentIndex: number = COLOR_CYCLE.indexOf(currentColor);
    const nextIndex: number = (currentIndex + 1) % COLOR_CYCLE.length;
    const nextColor: string = COLOR_CYCLE[nextIndex];

    setDateColors(prev => ({
      ...prev,
      [dateKey]: nextColor
    }));
  };
  
  const generateSvgForDownload = (): string => {
    const totalRows: number = Math.ceil(12 / SVG_CONFIG.MONTHS_PER_ROW);
    const totalWidth: number = (SVG_CONFIG.MONTH_WIDTH * SVG_CONFIG.MONTHS_PER_ROW) + (SVG_CONFIG.MONTH_COL_GAP * (SVG_CONFIG.MONTHS_PER_ROW - 1));
    const totalHeight: number = SVG_CONFIG.MAIN_TITLE_AREA_HEIGHT + (SVG_CONFIG.MONTH_HEIGHT * totalRows) + (SVG_CONFIG.MONTH_ROW_GAP * (totalRows - 1));

    let svgString: string = `<svg width="${totalWidth}" height="${totalHeight}" xmlns="http://www.w3.org/2000/svg" style="background-color: #f9fafb; font-family: sans-serif;">`;
    svgString += `<text x="${totalWidth / 2}" y="${SVG_CONFIG.MAIN_TITLE_AREA_HEIGHT / 2}" font-size="${SVG_CONFIG.YEAR_TITLE_FONT_SIZE}" font-weight="bold" text-anchor="middle" alignment-baseline="middle" fill="#111">${year}</text>`;

    const monthNames: string[] = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const allDayNames: Record<string, string> = { Su: "Su", Mo: "Mo", Tu: "Tu", We: "We", Th: "Th", Fr: "Fr", Sa: "Sa" };
    const dayNames: string[] = startDay === 'Su' ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    for (let month = 0; month < 12; month++) {
        if (!svgContainerRef.current) continue;
        const gElement = svgContainerRef.current.querySelectorAll('.month-svg-wrapper')[month]?.querySelector('svg > g');
        if (!gElement) continue;

        const row: number = Math.floor(month / SVG_CONFIG.MONTHS_PER_ROW);
        const col: number = Math.floor(month % SVG_CONFIG.MONTHS_PER_ROW);
        const x: number = col * (SVG_CONFIG.MONTH_WIDTH + SVG_CONFIG.MONTH_COL_GAP);
        const y: number = SVG_CONFIG.MAIN_TITLE_AREA_HEIGHT + row * (SVG_CONFIG.MONTH_HEIGHT + SVG_CONFIG.MONTH_ROW_GAP);
        
        let monthGroupString = `<g transform="translate(${x}, ${y})">`;
        
        monthGroupString += gElement.querySelector('g')?.outerHTML || '';
        monthGroupString += `<text x="${SVG_CONFIG.MONTH_WIDTH / 2}" y="${SVG_CONFIG.PADDING + SVG_CONFIG.MONTH_FONT_SIZE / 2}" font-size="${SVG_CONFIG.MONTH_FONT_SIZE}" font-weight="bold" text-anchor="middle" alignment-baseline="middle" font-family="sans-serif" fill="#111">${monthNames[month]}</text>`;
        
        dayNames.forEach((dayName, index) => {
            const isWeekend = dayName === 'Su' || dayName === 'Sa';
            const color = highlightWeekends && isWeekend ? COLORS.WEEKEND : '#555';
            monthGroupString += `<text x="${SVG_CONFIG.PADDING + index * SVG_CONFIG.CELL_WIDTH + SVG_CONFIG.CELL_WIDTH / 2}" y="${SVG_CONFIG.PADDING + SVG_CONFIG.HEADER_HEIGHT}" font-size="${SVG_CONFIG.DAY_HEADER_FONT_SIZE}" text-anchor="middle" alignment-baseline="middle" font-family="sans-serif" fill="${color}">${allDayNames[dayName]}</text>`;
        });

        const firstDayOfWeek: number = new Date(year, month, 1).getDay();
        const startingCol: number = startDay === 'Su' ? firstDayOfWeek : (firstDayOfWeek + 6) % 7;
        const daysInMonth: number = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            const dayCol = startDay === 'Su' ? dayOfWeek : (dayOfWeek + 6) % 7;
            const dayRow = Math.floor((startingCol + day - 1) / 7);

            const dayX = SVG_CONFIG.PADDING + dayCol * SVG_CONFIG.CELL_WIDTH + SVG_CONFIG.CELL_WIDTH / 2;
            const dayY = SVG_CONFIG.PADDING + SVG_CONFIG.HEADER_HEIGHT + SVG_CONFIG.DAY_HEADER_HEIGHT + dayRow * SVG_CONFIG.CELL_HEIGHT + SVG_CONFIG.CELL_HEIGHT / 2;

            let color = dateColors[dateKey] || COLORS.DEFAULT;
            if (!dateColors[dateKey] && highlightWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
                color = COLORS.WEEKEND;
            }
            
            monthGroupString += `<text x="${dayX}" y="${dayY}" font-size="${SVG_CONFIG.DAY_NUMBER_FONT_SIZE}" text-anchor="middle" alignment-baseline="middle" font-family="sans-serif" fill="${color}">${day}</text>`;
        }
        
        monthGroupString += `</g>`;
        svgString += monthGroupString;
    }

    svgString += `</svg>`;
    return svgString;
  }

  const handleDownload = (): void => {
    const svgContent: string = generateSvgForDownload();
    const blob: Blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url: string = URL.createObjectURL(blob);
    const a: HTMLAnchorElement = document.createElement('a');
    a.href = url;
    a.download = `calendar-${year}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-7xl mx-auto">
        <header className="bg-white border-b border-gray-200 rounded-lg p-6 mb-8 shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-4">SVG Calendar Generator</h1>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
            <div className="flex items-center gap-2">
              <label htmlFor="year-input" className="font-semibold text-gray-700">Year:</label>
              <input id="year-input" type="number" value={year} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setYear(parseInt(e.target.value, 10))} className="w-28 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="start-day-select" className="font-semibold text-gray-700">Start Week On:</label>
              <select id="start-day-select" value={startDay} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStartDay(e.target.value as StartDay)} className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500">
                <option value="Su">Sunday</option>
                <option value="Mo">Monday</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="highlight-weekends" type="checkbox" checked={highlightWeekends} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHighlightWeekends(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
              <label htmlFor="highlight-weekends" className="font-semibold text-gray-700">Highlight Weekends</label>
            </div>
            <button onClick={handleDownload} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
              Download SVG
            </button>
          </div>
        </header>

        <div ref={svgContainerRef}>
          <h2 className="text-4xl font-bold text-gray-800 text-center my-6">{year}</h2>
          <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div key={index} className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <div className="month-svg-wrapper">
                      <svg width="100%" viewBox={`0 0 ${SVG_CONFIG.MONTH_WIDTH} ${SVG_CONFIG.MONTH_HEIGHT}`}>
                          <MonthCalendar 
                            year={year} 
                            month={index} 
                            startDay={startDay}
                            highlightWeekends={highlightWeekends}
                            dateColors={dateColors}
                            onDateClick={handleDateClick}
                          />
                      </svg>
                  </div>
              </div>
            ))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default page;
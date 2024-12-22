import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import './App.css';

type Subject = {
  name: string;
  teacher: string;
  credits: string;
};

interface Timetable {
  [day: string]: {
    [slot: string]: string;
  };
}

const App: React.FC = () => {
  const [showContent, setShowContent] = useState(false);
  const [semesterData, setSemesterData] = useState<{
    semester: string;
    termStart: string;
    termEnd: string;
    roomNumber: string;
    numStudents: string;
    subjects: Subject[];
  }>({
    semester: '',
    termStart: '',
    termEnd: '',
    roomNumber: '',
    numStudents: '',
    subjects: [{ name: '', teacher: '', credits: '' }],
  });
  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<'english' | 'kannada' | 'hindi'>('english');
  const [translations, setTranslations] = useState<{[key: string]: string}>({});

  const timeSlots = [
    '9:00-9:55',
    '9:55-10:50',
    '11:05-12:00',
    '12:00-12:55',
    '13:45-14:40',
    '14:40-15:35',
    '15:35-16:30',
  ];

  useEffect(() => {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
  }, []);

  useEffect(() => {
    if (language !== 'english') {
      translateContent();
    }
  }, [language]);

  const translateContent = async () => {
    const textToTranslate = [
      'Timetable Generator',
      'Semester Details',
      'Semester',
      'Room Number',
      'Number of Students',
      'Subjects',
      'Subject Name',
      'Teacher Name',
      'Credits (theory:tutorial:practical)',
      'Add Subject',
      'Generate Timetable',
      'Export to Excel',
      'Generated Timetable',
      'Day',
      'Light Mode',
      'Dark Mode',
    ];

    const translatedText = await Promise.all(
      textToTranslate.map(async (text) => {
        const prompt = `Translate the following English text to ${language}: "${text}"`;
        const { text: translatedText } = await generateText({
          model: openai("gpt-4"),
          prompt: prompt
        });
        return { [text]: translatedText.trim() };
      })
    );

    const newTranslations = Object.assign({}, ...translatedText);
    setTranslations(newTranslations);
  };

  const getTranslation = (text: string) => {
    return translations[text] || text;
  };

  const handlePullUpScreen = () => {
    setShowContent(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSemesterData({ ...semesterData, [name]: value });
  };

  const handleSubjectChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const updatedSubjects = [...semesterData.subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [name]: value };
    setSemesterData({ ...semesterData, subjects: updatedSubjects });
  };

  const addSubject = () => {
    setSemesterData({
      ...semesterData,
      subjects: [...semesterData.subjects, { name: '', teacher: '', credits: '' }],
    });
  };

  const generateTimetable = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const newTimetable: Timetable = {};

    days.forEach((day) => {
      newTimetable[day] = {};
      timeSlots.forEach((slot) => {
        newTimetable[day][slot] = '';
      });
    });

    semesterData.subjects.forEach((subject) => {
      const [theory] = subject.credits.split(':').map(Number);

      for (let i = 0; i < theory; i++) {
        const day = days[Math.floor(Math.random() * days.length)];
        const slot = timeSlots[Math.floor(Math.random() * timeSlots.length)];

        if (!newTimetable[day][slot]) {
          newTimetable[day][slot] = `${subject.name} (Theory) - ${subject.teacher}`;
        }
      }
    });

    setTimetable(newTimetable);
  };

  const exportToExcel = () => {
    if (!timetable) return;

    const worksheet = XLSX.utils.json_to_sheet(
      Object.entries(timetable).flatMap(([day, slots]) =>
        Object.entries(slots).map(([slot, subject]) => ({
          Day: day,
          Time: slot,
          Subject: subject,
        }))
      )
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Timetable');
    XLSX.writeFile(workbook, 'timetable.xlsx');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className={`app ${isDarkMode ? 'dark' : 'light'}`}>
      {!showContent ? (
        <div 
          className="pull-up-screen"
          onClick={handlePullUpScreen}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <h1 style={{ color: isDarkMode ? 'white' : 'black', fontSize: '3rem' }}>{getTranslation('Timetable Generator')}</h1>
        </div>
      ) : (
        <div className="content-container">
          <div className="controls">
            <button
              onClick={toggleTheme}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isDarkMode ? '#ffffff' : '#000000',
                color: isDarkMode ? '#000000' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '1rem'
              }}
            >
              {isDarkMode ? getTranslation('Light Mode') : getTranslation('Dark Mode')}
            </button>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'english' | 'kannada' | 'hindi')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: isDarkMode ? '#444' : 'white',
                color: isDarkMode ? 'white' : 'black',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <option value="english">English</option>
              <option value="kannada">Kannada</option>
              <option value="hindi">Hindi</option>
            </select>
          </div>
          <div className="form-container" style={{ 
            background: isDarkMode ? '#333' : 'white',
            color: isDarkMode ? 'white' : 'black',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            marginTop: '2rem'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{getTranslation('Semester Details')}</h2>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              <input
                type="text"
                name="semester"
                placeholder={getTranslation('Semester')}
                value={semesterData.semester}
                onChange={handleInputChange}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: isDarkMode ? '#444' : 'white',
                  color: isDarkMode ? 'white' : 'black',
                }}
              />
              <input
                type="date"
                name="termStart"
                value={semesterData.termStart}
                onChange={handleInputChange}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: isDarkMode ? '#444' : 'white',
                  color: isDarkMode ? 'white' : 'black',
                }}
              />
              <input
                type="date"
                name="termEnd"
                value={semesterData.termEnd}
                onChange={handleInputChange}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: isDarkMode ? '#444' : 'white',
                  color: isDarkMode ? 'white' : 'black',
                }}
              />
              <input
                type="text"
                name="roomNumber"
                placeholder={getTranslation('Room Number')}
                value={semesterData.roomNumber}
                onChange={handleInputChange}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: isDarkMode ? '#444' : 'white',
                  color: isDarkMode ? 'white' : 'black',
                }}
              />
              <input
                type="number"
                name="numStudents"
                placeholder={getTranslation('Number of Students')}
                value={semesterData.numStudents}
                onChange={handleInputChange}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: isDarkMode ? '#444' : 'white',
                  color: isDarkMode ? 'white' : 'black',
                }}
              />
            </div>

            <h2 style={{ marginBottom: '1.5rem' }}>{getTranslation('Subjects')}</h2>
            {semesterData.subjects.map((subject, index) => (
              <div key={index} style={{ 
                display: 'grid',
                gap: '1rem',
                marginBottom: '1rem',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'
              }}>
                <input
                  type="text"
                  name="name"
                  placeholder={getTranslation('Subject Name')}
                  value={subject.name}
                  onChange={(e) => handleSubjectChange(index, e)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: isDarkMode ? '#444' : 'white',
                    color: isDarkMode ? 'white' : 'black',
                  }}
                />
                <input
                  type="text"
                  name="teacher"
                  placeholder={getTranslation('Teacher Name')}
                  value={subject.teacher}
                  onChange={(e) => handleSubjectChange(index, e)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: isDarkMode ? '#444' : 'white',
                    color: isDarkMode ? 'white' : 'black',
                  }}
                />
                <input
                  type="text"
                  name="credits"
                  placeholder={getTranslation('Credits (theory:tutorial:practical)')}
                  value={subject.credits}
                  onChange={(e) => handleSubjectChange(index, e)}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: isDarkMode ? '#444' : 'white',
                    color: isDarkMode ? 'white' : 'black',
                  }}
                />
              </div>
            ))}
            
            <div style={{ 
              display: 'flex',
              gap: '1rem',
              marginTop: '1rem',
              marginBottom: '2rem'
            }}>
              <button
                onClick={addSubject}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isDarkMode ? '#555' : '#ff0000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {getTranslation('Add Subject')}
              </button>
              <button
                onClick={generateTimetable}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isDarkMode ? '#555' : '#000000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {getTranslation('Generate Timetable')}
              </button>
              <button
                onClick={exportToExcel}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: isDarkMode ? '#555' : '#333333',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {getTranslation('Export to Excel')}
              </button>
            </div>

            {timetable && (
              <div style={{ marginTop: '2rem' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>{getTranslation('Generated Timetable')}</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ 
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: isDarkMode ? '#222' : 'white',
                    color: isDarkMode ? 'white' : 'black',
                  }}>
                    <thead>
                      <tr>
                        <th style={{ 
                          border: '1px solid #ccc',
                          padding: '0.5rem',
                          backgroundColor: isDarkMode ? '#444' : '#1b1b1b',
                          color: 'white'
                        }}>{getTranslation('Day')}</th>
                        {timeSlots.map((slot) => (
                          <th key={slot} style={{ 
                            border: '1px solid #ccc',
                            padding: '0.5rem',
                            backgroundColor: isDarkMode ? '#444' : '#1b1b1b',
                            color: 'white'
                          }}>{slot}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(timetable).map(([day, slots]) => (
                        <tr key={day}>
                          <td style={{ 
                            border: '1px solid #ccc',
                            padding: '0.5rem',
                            fontWeight: 'bold'
                          }}>{day}</td>
                          {timeSlots.map((slot) => (
                            <td key={slot} style={{ 
                              border: '1px solid #ccc',
                              padding: '0.5rem'
                            }}>{slots[slot] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


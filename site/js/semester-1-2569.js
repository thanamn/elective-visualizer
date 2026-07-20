"use strict";

window.ELECTIVE_SEMESTER = {
  id: "1-2569",
  storageKey: "cedt-elective-plan-1-2569-v1",
  dataPath: "./elective_1_2569.json",
  portalImport: {
    storageKey: "cedt-elective-import-1-2569-v1",
    portalUrl: "https://elective.cedt.community/list?limit=100",
    roundId: "cmr0f94gs074eos8xgtg7f328",
  },
  days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
  companyLogos: {
    "จุฬาลงกรณ์มหาวิทยาลัย": "/assets/company-logos/chulalongkorn-university.png",
    "บริษัท เอคเซนเชอร์ โซลูชั่นส์ จำกัด": "/assets/company-logos/accenture.svg",
    "บริษัท เดอะมั๊งค์สตูดิโอ จำกัด": "/assets/company-logos/the-monk-studios.png",
    "บริษัท บี.กริม เพาเวอร์ จำกัด (มหาชน)": "/assets/company-logos/bgrimm-power.svg",
    "บริษัท เพลย์ทอเรียม โซลูชันส์ จำกัด": "/assets/company-logos/playtorium.png",
    "บริษัท รีเลิร์น โซลูชั่น จำกัด": "/assets/company-logos/relearn-solution.jpg",
    "บริษัท หัวเว่ย เทคโนโลยี่ (ประเทศไทย) จำกัด": "/assets/company-logos/huawei.png",
    "บริษัท เอซิส โปรเฟสชั่นนัล เซ็นเตอร์ จำกัด": "/assets/company-logos/acis.png",
    "บริษัท แอตตร้าอินเตอร์กรุ๊ป จำกัด": "/assets/company-logos/attra-inter-group.png",
    "PTT Global Chemical": "/assets/company-logos/pttgc.svg",
    "SEA Bridge": "/assets/company-logos/sea-bridge.png",
  },
  fixedCourseChoice: {
    storageKey: "cedt-elective-technical-writing-1-2569-v1",
    courseIds: ["FIXED_TECHNICAL_WRITING_AM", "FIXED_TECHNICAL_WRITING_PM"],
    options: [
      {
        value: "sections-51-55",
        courseId: "FIXED_TECHNICAL_WRITING_AM",
        label: "Sections 51–55 · Morning",
      },
      {
        value: "sections-56-60",
        courseId: "FIXED_TECHNICAL_WRITING_PM",
        label: "Sections 56–60 · Afternoon",
      },
    ],
  },
  fixedCourses: [
    {
      id: "FIXED_TECHNICAL_WRITING_AM",
      code: "5500305",
      name: "Technical Writing / Eng 3 · Groups 51–55",
      color: "#d9d2e9",
      schedule: [fixed("TUESDAY", "01:00", "04:00")],
    },
    {
      id: "FIXED_TECHNICAL_WRITING_PM",
      code: "5500305",
      name: "Technical Writing / Eng 3 · Groups 56–60",
      color: "#d9d2e9",
      schedule: [fixed("TUESDAY", "06:00", "09:00")],
    },
    {
      id: "FIXED_IOT_DIGITAL_SOLUTIONS",
      code: "2110575",
      name: "IoT Systems & Digital Problem Solving",
      color: "#d9ead3",
      schedule: [fixed("WEDNESDAY", "01:00", "04:00")],
    },
    {
      id: "FIXED_COMPUTER_SECURITY",
      code: "2110413",
      name: "Computer Security",
      color: "#fff2cc",
      schedule: [fixed("WEDNESDAY", "06:00", "09:00")],
    },
    {
      id: "FIXED_SOFTWARE_DEFINED_SYSTEMS",
      code: "2110506",
      name: "Software-Defined Systems I",
      color: "#fce5cd",
      schedule: [fixed("THURSDAY", "06:00", "09:00")],
    },
    {
      id: "FIXED_CAPSTONE",
      code: "2110488",
      name: "Capstone Project I / Friday Activities",
      color: "#d9d9d9",
      schedule: [fixed("FRIDAY", "06:00", "09:00")],
    },
  ],
};

function fixed(day, start, end) {
  return {
    day,
    start_time: `1970-01-01T${start}:00.000Z`,
    end_time: `1970-01-01T${end}:00.000Z`,
    weeks: Array.from({ length: 18 }, (_, index) => index + 1),
  };
}

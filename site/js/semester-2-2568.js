"use strict";

window.ELECTIVE_SEMESTER = {
  id: "2-2568",
  storageKey: "cedt-elective-plan-v2",
  dataPath: "../elective_latest.json",
  days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
  companyLogos: {
    "จุฬาลงกรณ์มหาวิทยาลัย": "/assets/company-logos/chulalongkorn-university.png",
    "LOOK ALIVE Studio": "/assets/company-logos/look-alive-studio.jpg",
    "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี (มจธ.)": "/assets/company-logos/kmutt.png",
    "บริษัท เอส เทลลิเจนซ์ จำกัด": "/assets/company-logos/stelligence.png",
    "บริษัท เอซิส โปรเฟสชั่นนัล เซ็นเตอร์ จำกัด": "/assets/company-logos/acis.png",
    "บริษัท รีเลิร์น โซลูชั่น จำกัด": "/assets/company-logos/relearn-solution.jpg",
    "บริษัท ฟินเทค (ประเทศไทย) จำกัด": "/assets/company-logos/fintech-thailand.png",
    "บริษัท เพลย์ทอเรียม โซลูชันส์ จำกัด": "/assets/company-logos/playtorium.png",
    "บริษัท เดอะมั๊งค์สตูดิโอ จำกัด": "/assets/company-logos/the-monk-studios.png",
    "บริษัท เซ็นส์ อินโฟ เทค จำกัด": "/assets/company-logos/sense-info-tech.png",
    "บริษัท กรีนมูนส์ จำกัด": "/assets/company-logos/greenmoons.png",
    "PTT Global Chemical": "/assets/company-logos/pttgc.svg",
    "NIPA Technology Co., Ltd. , AKA * NIPA Cloud *": "/assets/company-logos/nipa-cloud.svg",
    "บริษัท ดีมีเตอร์ ไอซีที จำกัด": "/assets/company-logos/demeter-ict.png",
    "สถาบันบัณฑิตพัฒนบริหารศาสตร์ (นิด้า)": "/assets/company-logos/nida.svg",
    "SEA Bridge": "/assets/company-logos/sea-bridge.png",
  },
  fixedCourses: [
    {
      id: "FIXED_OS_NETWORK",
      name: "OS & Network",
      schedule: [
        fixed("MONDAY", "01:00", "04:00", weeks(1, 6)),
        fixed("MONDAY", "06:00", "09:00", weeks(1, 6)),
        fixed("TUESDAY", "06:00", "09:00", weeks(1, 6)),
        fixed("WEDNESDAY", "01:00", "04:00", weeks(1, 6)),
        fixed("WEDNESDAY", "06:00", "09:00", weeks(1, 6)),
        fixed("THURSDAY", "01:00", "04:00", weeks(1, 6)),
        fixed("THURSDAY", "06:00", "09:00", weeks(1, 6)),
        fixed("FRIDAY", "01:00", "04:00", weeks(1, 6)),
      ],
    },
    {
      id: "FIXED_AI_ML",
      name: "AI/ML",
      schedule: [
        fixed("MONDAY", "01:00", "04:00", weeks(7, 9)),
        fixed("MONDAY", "06:00", "09:00", weeks(7, 9)),
        fixed("THURSDAY", "01:00", "04:00", weeks(7, 18)),
        fixed("THURSDAY", "06:00", "09:00", weeks(7, 9)),
      ],
    },
    {
      id: "FIXED_COMMUNICATION",
      name: "Communication",
      schedule: [
        fixed("TUESDAY", "01:00", "04:00", weeks(1, 18)),
      ],
    },
    {
      id: "FIXED_FRIDAY_ACTIVITY",
      name: "Friday Activity",
      schedule: [
        fixed("FRIDAY", "06:00", "09:00", weeks(1, 18)),
      ],
    },
  ],
};

function fixed(day, start, end, activeWeeks) {
  return {
    day,
    start_time: `1970-01-01T${start}:00.000Z`,
    end_time: `1970-01-01T${end}:00.000Z`,
    weeks: activeWeeks,
  };
}

function weeks(start, end) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

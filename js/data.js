/* ═══════════════════════════════════════════════════════
   Rawabit — shared mock data (profiles + AI responses)
   ═══════════════════════════════════════════════════════ */
window.RAWABIT = {
  profiles: [
    {
      id: 1,
      name: 'Dr. Amina Benali',
      nameAr: 'د. أمينة بن علي',
      title: 'Senior AI Researcher',
      titleAr: 'باحثة أولى في الذكاء الاصطناعي',
      location: 'Algiers, Algeria',
      avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      reliability: 94,
      academic: [
        { degree: 'PhD in Computer Science', institution: 'USTHB', year: '2020' },
        { degree: 'MSc Artificial Intelligence', institution: 'ESI Alger', year: '2016' },
        { degree: 'BSc Mathematics', institution: 'USTHB', year: '2013' }
      ],
      professional: [
        { role: 'Senior AI Engineer', company: 'Sonatrach R&D', period: '2022 — Present' },
        { role: 'ML Engineer', company: 'Djezzy', period: '2018 — 2022' },
        { role: 'Data Analyst', company: 'Yassir', period: '2016 — 2018' }
      ],
      skills: [
        { name: 'Python', level: 95 },
        { name: 'TensorFlow', level: 85 },
        { name: 'NLP', level: 80 }
      ],
      tags: ['AI', 'ML', 'DeepLearning', 'NLP', 'Research']
    },
    {
      id: 2,
      name: 'Youcef Hadj Moussa',
      nameAr: 'يوسف حاج موسى',
      title: 'Structural Engineer',
      titleAr: 'مهندس هياكل',
      location: 'Constantine, Algeria',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      reliability: 88,
      academic: [
        { degree: 'MSc Civil Engineering', institution: 'Univ. Constantine', year: '2018' },
        { degree: 'BSc Civil Engineering', institution: 'Univ. Constantine', year: '2015' }
      ],
      professional: [
        { role: 'Lead Structural Engineer', company: 'COSIDER', period: '2021 — Present' },
        { role: 'Project Engineer', company: 'SEROR', period: '2018 — 2021' }
      ],
      skills: [
        { name: 'AutoCAD', level: 92 },
        { name: 'ETABS', level: 88 },
        { name: 'Project Mgmt', level: 75 }
      ],
      tags: ['Engineering', 'Infrastructure', 'BIM', 'Construction']
    },
    {
      id: 3,
      name: 'Lina Mebarki',
      nameAr: 'لينا مباركي',
      title: 'Biomedical Researcher',
      titleAr: 'باحثة في الطب الحيوي',
      location: 'Oran, Algeria',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      reliability: 91,
      academic: [
        { degree: 'PhD Biomedical Sciences', institution: 'Univ. Oran', year: '2022' },
        { degree: 'MD Medicine', institution: 'Univ. Oran', year: '2017' }
      ],
      professional: [
        { role: 'Research Fellow', company: 'Pasteur Institute Algiers', period: '2022 — Present' },
        { role: 'Resident Physician', company: 'CHU Oran', period: '2017 — 2022' }
      ],
      skills: [
        { name: 'Genomics', level: 90 },
        { name: 'Bioinformatics', level: 82 },
        { name: 'Clinical Trials', level: 78 }
      ],
      tags: ['Biomedical', 'Genomics', 'PublicHealth', 'Research']
    }
  ],

  aiResponses: [
    {
      keywords: ['ai', 'ذكاء', 'intelligence', 'machine', 'تعلم'],
      answer: 'Based on indexed records, Algeria has a growing ecosystem of **142 AI specialists** concentrated in Algiers (38%), Constantine (15%), and Oran (12%). Key institutions include USTHB, ESI Alger, and CERIST. [1] Recent graduates from the USTHB doctoral program have published in top-tier venues including NeurIPS and AAAI. [2] Sonatrach and Sonelgaz are the largest private-sector employers of ML talent. [3]',
      citations: [
        { id: 1, source: 'CERIST Annual Report 2025', url: '#' },
        { id: 2, source: 'USTHB Research Portal', url: '#' },
        { id: 3, source: 'Ministry of Digital Economy', url: '#' }
      ]
    },
    {
      keywords: ['engineer', 'هندسة', 'مهندس', 'civil', 'construction'],
      answer: 'Algeria\'s engineering talent pool spans **1,240 verified profiles** across civil, electrical, and mechanical disciplines. [1] The construction sector alone employs 680+ engineers with verified competencies, with COSIDER Group and SEROR being the top employers. [2] The University of Constantine and USTHB produce the highest number of engineering graduates annually. [3]',
      citations: [
        { id: 1, source: 'Rawabit Engineering Index 2025', url: '#' },
        { id: 2, source: 'ONS Labour Statistics', url: '#' },
        { id: 3, source: 'MESRS Higher Education Data', url: '#' }
      ]
    },
    {
      keywords: ['médecin', 'طبيب', 'doctor', 'medical', 'health', 'صحة'],
      answer: 'The medical competencies database tracks **890 healthcare professionals** with verified credentials. [1] Oran and Algiers host the highest concentration of specialists, particularly in cardiology and oncology. [2] The Pasteur Institute and CHU facilities serve as primary research hubs for biomedical innovation. [3]',
      citations: [
        { id: 1, source: 'Rawabit Health Index', url: '#' },
        { id: 2, source: 'Ministry of Health Records', url: '#' },
        { id: 3, source: "Institut Pasteur d'Algérie", url: '#' }
      ]
    }
  ],

  defaultAi: {
    answer: 'I found **2,340 competency profiles** matching your query across multiple sectors. The highest concentrations are in Algiers (28%), Oran (16%), and Constantine (11%). [1] For more precise results, try specifying a field such as "AI researchers in Algiers" or "civil engineers Constantine". [2]',
    citations: [
      { id: 1, source: 'Rawabit National Database', url: '#' },
      { id: 2, source: 'Platform Usage Guide', url: '#' }
    ]
  },

  findAi: function (q) {
    var lower = (q || '').toLowerCase();
    for (var i = 0; i < this.aiResponses.length; i++) {
      var resp = this.aiResponses[i];
      for (var j = 0; j < resp.keywords.length; j++) {
        if (lower.indexOf(resp.keywords[j]) !== -1) return resp;
      }
    }
    return this.defaultAi;
  },

  getProfile: function (id) {
    id = Number(id);
    for (var i = 0; i < this.profiles.length; i++) {
      if (this.profiles[i].id === id) return this.profiles[i];
    }
    return null;
  },

  escapeHtml: function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
};

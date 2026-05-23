const links = [
  { label: "About", url: "/about" },
  { label: "Education", url: "/education" },
  { label: "Experience", url: "/experience" },
  { label: "Projects", url: "/projects" },
  { label: "Skills", url: "/skills" },
  { label: "Contact", url: "/contact" },
];

const mapUserToPortfolio = (user) => {
  if (!user) return null;

  return {
    projectNavbarData: {
      projectName: user.username || "",
      projectOptionName: "",
      profileImage: user.profileImage || "",
      projectNavLink: links,
    },

    contactData: {
      title: "Contact",
      sub_title:
        "Feel free to connect for opportunities, collaborations, or any further information.",
      fName: user.username || "",
      lName: "",
      role:
        user.experience?.[user.experience?.length - 1]?.role ||
        "Software Engineer",

      contact: [
        {
          title: "Email",
          displayName: user.email,
          link: `mailto:${user.email}`,
          icon: "fa fa-envelope",
        },
        ...(user.contactDetails?.phones || []).map((p) => ({
          title: "Contact",
          displayName: p.number,
          link: `tel:${p.number}`,
          icon: "fa fa-mobile",
        })),
        ...(user.contactDetails?.addresses || []).map((a) => ({
          title: "Address",
          displayName: `${a.city}, ${a.state}, ${a.country}`,
          link: "#",
          icon: "fa fa-map-marker-alt",
        })),
      ],

      contactFormSection: {
        title: "Contact me",
        image: "/assets/img/contact-section.jpeg",
        sub_title: "Feel free to connect",
      },
    },

    aboutData: {
      title: "About",
      description: user.about || "",
      "sub-description": "",
      image: "/assets/img/profile-pic.jpg",
      "more-info": "Read More",
      more_details: {},
    },

    resumeData: {
      resumeLink: "",
      downloadLink: "",
      downloadText: "Resume",
      downloadIcon: "fa fa-download",
      resumeName: `${user.username}-Resume`,
      resumeHeading: "Resume",

      educationData: {
        title: "Education",
        sub_title:
          "Knowledge, learning, and continuous improvement that build a strong foundation for future success.",
        educationItems:
          user.education?.map((edu) => ({
            title: edu.standard,
            institution: edu.institution,
            date: edu.passingYear?.toString(),
            location: "",
            details: edu.specialization || "",
            percentage: edu.grade || "",
          })) || [],
      },

      projectData: {
        title: "Featured Projects",
        sub_title:
          "A showcase of meaningful work, creative ideas, and practical achievements delivered with passion.",
        projects:
          user.projects?.map((p) => ({
            projectImg: "/assets/img/projects/default.png",
            projectOrg: "",
            projectLink: p.projectUrl || "#",
            name: p.title,
            projectHeading: p.title,
            projectRole: "",
            teamMembers: "1",
            projectDetail: {
              description: p.description,
              keyFeatures: [],
              technologiesUsed: {
                frontend: p.technologies?.join(", "),
              },
              challengesSolved: [],
              outcome: "",
            },
          })) || [],
      },

      experienceData: {
        title: "Professional Experience",
        sub_title:
          "A journey of growth, dedication, and valuable contributions across different roles and responsibilities.",
        experienceItems:
          user.experience?.map((exp) => ({
            jobRole: exp.role,
            org_title: exp.companyName,
            orgLogo: "/assets/img/default.png",
            org_link: "#",
            date: `${exp.startDate?.toLocaleDateString()} - ${
              exp.isCurrentlyWorking
                ? "Present"
                : exp.endDate?.toLocaleDateString()
            }`,
            location: "",
            projectsHandled: exp.technologiesUsed?.length || 0,
          })) || [],
      },

      skillsData: {
        title: "Technical Expertise",
        sub_title:
          "Skills, tools, and capabilities developed through hands-on experience and continuous learning.",
        skillItems:
          user.skills?.map((s) => ({
            name: s.name,
            icon: `${s?.name?.toLowerCase()?.trim()}`,
            level: mapSkillLevel(s.level),
          })) || [],
      },
    },

    footerData: {
      footerText: `Copyright © ${new Date().getFullYear()} ${user.username}. All rights reserved.`,
      footerLinks: links,
    },

    socialLinks:
      user.contactDetails?.socialLinks?.map((s) => ({
        name: s.platform,
        link: s.url,
        icon: `fab fa-${s.platform?.toLowerCase()?.trim()}`,
        color: "#000",
      })) || [],
  };
};

// Helper for skill level conversion
const mapSkillLevel = (level) => {
  switch (level) {
    case "BEGINNER":
      return "40";
    case "INTERMEDIATE":
      return "60";
    case "ADVANCED":
      return "80";
    case "EXPERT":
      return "95";
    default:
      return "50";
  }
};

export default mapUserToPortfolio;

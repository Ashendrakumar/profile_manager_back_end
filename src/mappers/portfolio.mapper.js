const mapUserToPortfolio = (user) => {
  if (!user) return null;

  return {
    projectNavbarData: {
      projectName: user.username || "",
      projectOptionName: "",
      profileImage: "/assets/img/profile-pic.jpg",
      projectNavLink: [
        { label: "About", url: "/about" },
        { label: "Projects", url: "/projects" },
        { label: "Contact", url: "/contact" },
        { label: "Resume", url: "/resume" },
      ],
    },

    contactData: {
      title: "Contact",
      sub_title: "Get in touch with me",
      fName: user.username || "",
      lName: "",
      role: user.experience?.[0]?.role || "Software Engineer",

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
          icon: "fa-map-marker-alt",
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

      more_details: {
        organizations:
          user.experience?.map((exp) => ({
            name: exp.companyName,
            code: exp.companyName,
            from: exp.startDate?.getFullYear()?.toString(),
            to: exp.isCurrentlyWorking
              ? "Present"
              : exp.endDate?.getFullYear()?.toString(),
            image: "/assets/images/about.jpg",
            link: "#",
          })) || [],

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
    },

    resumeData: {
      resumeLink: "",
      downloadLink: "",
      downloadText: "Download Resume",
      downloadIcon: "fa fa-download",
      resumeName: `${user.username}-Resume`,
      resumeHeading: "Resume",

      educationData: {
        title: "Education",
        sub_title: "My Education",
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

      experienceData: {
        title: "Experience",
        sub_title: "My Experience",
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
        title: "Technical Skills",
        sub_title: "My Skills",
        skillItems:
          user.skills?.map((s) => ({
            name: s.name,
            icon: "fa fa-code",
            level: mapSkillLevel(s.level),
          })) || [],
      },
    },

    footerData: {
      footerText: "Copyright © 2026",
      footerLinks: [
        { label: "Home", url: "/" },
        { label: "About", url: "/about" },
        { label: "Contact", url: "/contact" },
        { label: "Resume", url: "/resume" },
      ],
    },

    socialLinks:
      user.contactDetails?.socialLinks?.map((s) => ({
        name: s.platform,
        link: s.url,
        icon: "fab fa-linkedin",
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

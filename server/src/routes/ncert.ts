import express from "express";

const router = express.Router();

const NCERT_CHAPTERS: Record<string, Record<string, Record<string, { name: string; url: string }[]>>> = {
  "11": {
    Physics: {
      chapters: [
        { name: "Chapter 1: Physical World", url: "https://ncert.nic.in/textbook/pdf/keph101.pdf" },
        { name: "Chapter 2: Units and Measurements", url: "https://ncert.nic.in/textbook/pdf/keph102.pdf" },
        { name: "Chapter 3: Motion in a Straight Line", url: "https://ncert.nic.in/textbook/pdf/keph103.pdf" },
        { name: "Chapter 4: Motion in a Plane", url: "https://ncert.nic.in/textbook/pdf/keph104.pdf" },
        { name: "Chapter 5: Laws of Motion", url: "https://ncert.nic.in/textbook/pdf/keph105.pdf" },
        { name: "Chapter 6: Work, Energy and Power", url: "https://ncert.nic.in/textbook/pdf/keph106.pdf" },
        { name: "Chapter 7: System of Particles and Rotational Motion", url: "https://ncert.nic.in/textbook/pdf/keph107.pdf" },
        { name: "Chapter 8: Gravitation", url: "https://ncert.nic.in/textbook/pdf/keph108.pdf" },
        { name: "Chapter 9: Mechanical Properties of Solids", url: "https://ncert.nic.in/textbook/pdf/keph109.pdf" },
        { name: "Chapter 10: Mechanical Properties of Fluids", url: "https://ncert.nic.in/textbook/pdf/keph110.pdf" },
        { name: "Chapter 11: Thermal Properties of Matter", url: "https://ncert.nic.in/textbook/pdf/keph111.pdf" },
        { name: "Chapter 12: Thermodynamics", url: "https://ncert.nic.in/textbook/pdf/keph112.pdf" },
        { name: "Chapter 13: Kinetic Theory", url: "https://ncert.nic.in/textbook/pdf/keph113.pdf" },
        { name: "Chapter 14: Oscillations", url: "https://ncert.nic.in/textbook/pdf/keph114.pdf" },
        { name: "Chapter 15: Waves", url: "https://ncert.nic.in/textbook/pdf/keph115.pdf" },
      ] as any,
    },
    Chemistry: {
      chapters: [
        { name: "Chapter 1: Some Basic Concepts of Chemistry", url: "https://ncert.nic.in/textbook/pdf/kech101.pdf" },
        { name: "Chapter 2: Structure of Atom", url: "https://ncert.nic.in/textbook/pdf/kech102.pdf" },
        { name: "Chapter 3: Classification of Elements and Periodicity", url: "https://ncert.nic.in/textbook/pdf/kech103.pdf" },
        { name: "Chapter 4: Chemical Bonding and Molecular Structure", url: "https://ncert.nic.in/textbook/pdf/kech104.pdf" },
        { name: "Chapter 5: Thermodynamics", url: "https://ncert.nic.in/textbook/pdf/kech105.pdf" },
        { name: "Chapter 6: Equilibrium", url: "https://ncert.nic.in/textbook/pdf/kech106.pdf" },
        { name: "Chapter 7: Redox Reactions", url: "https://ncert.nic.in/textbook/pdf/kech107.pdf" },
        { name: "Chapter 8: Organic Chemistry - Basic Principles", url: "https://ncert.nic.in/textbook/pdf/kech108.pdf" },
        { name: "Chapter 9: Hydrocarbons", url: "https://ncert.nic.in/textbook/pdf/kech109.pdf" },
      ] as any,
    },
    Mathematics: {
      chapters: [
        { name: "Chapter 1: Sets", url: "https://ncert.nic.in/textbook/pdf/kemh101.pdf" },
        { name: "Chapter 2: Relations and Functions", url: "https://ncert.nic.in/textbook/pdf/kemh102.pdf" },
        { name: "Chapter 3: Trigonometric Functions", url: "https://ncert.nic.in/textbook/pdf/kemh103.pdf" },
        { name: "Chapter 4: Complex Numbers", url: "https://ncert.nic.in/textbook/pdf/kemh104.pdf" },
        { name: "Chapter 5: Linear Inequalities", url: "https://ncert.nic.in/textbook/pdf/kemh105.pdf" },
        { name: "Chapter 6: Permutations and Combinations", url: "https://ncert.nic.in/textbook/pdf/kemh106.pdf" },
        { name: "Chapter 7: Binomial Theorem", url: "https://ncert.nic.in/textbook/pdf/kemh107.pdf" },
        { name: "Chapter 8: Sequences and Series", url: "https://ncert.nic.in/textbook/pdf/kemh108.pdf" },
        { name: "Chapter 9: Straight Lines", url: "https://ncert.nic.in/textbook/pdf/kemh109.pdf" },
        { name: "Chapter 10: Conic Sections", url: "https://ncert.nic.in/textbook/pdf/kemh110.pdf" },
      ] as any,
    },
    Biology: {
      chapters: [
        { name: "Chapter 1: The Living World", url: "https://ncert.nic.in/textbook/pdf/kebo101.pdf" },
        { name: "Chapter 2: Biological Classification", url: "https://ncert.nic.in/textbook/pdf/kebo102.pdf" },
        { name: "Chapter 3: Plant Kingdom", url: "https://ncert.nic.in/textbook/pdf/kebo103.pdf" },
        { name: "Chapter 4: Animal Kingdom", url: "https://ncert.nic.in/textbook/pdf/kebo104.pdf" },
        { name: "Chapter 5: Morphology of Flowering Plants", url: "https://ncert.nic.in/textbook/pdf/kebo105.pdf" },
        { name: "Chapter 6: Anatomy of Flowering Plants", url: "https://ncert.nic.in/textbook/pdf/kebo106.pdf" },
        { name: "Chapter 7: Structural Organisation in Animals", url: "https://ncert.nic.in/textbook/pdf/kebo107.pdf" },
      ] as any,
    },
  },
  "12": {
    Physics: {
      chapters: [
        { name: "Chapter 1: Electric Charges and Fields", url: "https://ncert.nic.in/textbook/pdf/leph101.pdf" },
        { name: "Chapter 2: Electrostatic Potential and Capacitance", url: "https://ncert.nic.in/textbook/pdf/leph102.pdf" },
        { name: "Chapter 3: Current Electricity", url: "https://ncert.nic.in/textbook/pdf/leph103.pdf" },
        { name: "Chapter 4: Moving Charges and Magnetism", url: "https://ncert.nic.in/textbook/pdf/leph104.pdf" },
        { name: "Chapter 5: Magnetism and Matter", url: "https://ncert.nic.in/textbook/pdf/leph105.pdf" },
        { name: "Chapter 6: Electromagnetic Induction", url: "https://ncert.nic.in/textbook/pdf/leph106.pdf" },
        { name: "Chapter 7: Alternating Current", url: "https://ncert.nic.in/textbook/pdf/leph107.pdf" },
        { name: "Chapter 8: Electromagnetic Waves", url: "https://ncert.nic.in/textbook/pdf/leph108.pdf" },
        { name: "Chapter 9: Ray Optics and Optical Instruments", url: "https://ncert.nic.in/textbook/pdf/leph109.pdf" },
        { name: "Chapter 10: Wave Optics", url: "https://ncert.nic.in/textbook/pdf/leph110.pdf" },
        { name: "Chapter 11: Dual Nature of Radiation and Matter", url: "https://ncert.nic.in/textbook/pdf/leph111.pdf" },
        { name: "Chapter 12: Atoms", url: "https://ncert.nic.in/textbook/pdf/leph112.pdf" },
        { name: "Chapter 13: Nuclei", url: "https://ncert.nic.in/textbook/pdf/leph113.pdf" },
        { name: "Chapter 14: Semiconductor Electronics", url: "https://ncert.nic.in/textbook/pdf/leph114.pdf" },
      ] as any,
    },
    Chemistry: {
      chapters: [
        { name: "Chapter 1: The Solid State", url: "https://ncert.nic.in/textbook/pdf/lech101.pdf" },
        { name: "Chapter 2: Solutions", url: "https://ncert.nic.in/textbook/pdf/lech102.pdf" },
        { name: "Chapter 3: Electrochemistry", url: "https://ncert.nic.in/textbook/pdf/lech103.pdf" },
        { name: "Chapter 4: Chemical Kinetics", url: "https://ncert.nic.in/textbook/pdf/lech104.pdf" },
        { name: "Chapter 5: Surface Chemistry", url: "https://ncert.nic.in/textbook/pdf/lech105.pdf" },
        { name: "Chapter 6: General Principles of Isolation of Elements", url: "https://ncert.nic.in/textbook/pdf/lech106.pdf" },
        { name: "Chapter 7: The p-Block Elements", url: "https://ncert.nic.in/textbook/pdf/lech107.pdf" },
        { name: "Chapter 8: The d and f Block Elements", url: "https://ncert.nic.in/textbook/pdf/lech108.pdf" },
        { name: "Chapter 9: Coordination Compounds", url: "https://ncert.nic.in/textbook/pdf/lech109.pdf" },
        { name: "Chapter 10: Haloalkanes and Haloarenes", url: "https://ncert.nic.in/textbook/pdf/lech110.pdf" },
        { name: "Chapter 11: Alcohols, Phenols and Ethers", url: "https://ncert.nic.in/textbook/pdf/lech111.pdf" },
        { name: "Chapter 12: Aldehydes, Ketones and Carboxylic Acids", url: "https://ncert.nic.in/textbook/pdf/lech112.pdf" },
        { name: "Chapter 13: Amines", url: "https://ncert.nic.in/textbook/pdf/lech113.pdf" },
        { name: "Chapter 14: Biomolecules", url: "https://ncert.nic.in/textbook/pdf/lech114.pdf" },
      ] as any,
    },
    Mathematics: {
      chapters: [
        { name: "Chapter 1: Relations and Functions", url: "https://ncert.nic.in/textbook/pdf/lemh101.pdf" },
        { name: "Chapter 2: Inverse Trigonometric Functions", url: "https://ncert.nic.in/textbook/pdf/lemh102.pdf" },
        { name: "Chapter 3: Matrices", url: "https://ncert.nic.in/textbook/pdf/lemh103.pdf" },
        { name: "Chapter 4: Determinants", url: "https://ncert.nic.in/textbook/pdf/lemh104.pdf" },
        { name: "Chapter 5: Continuity and Differentiability", url: "https://ncert.nic.in/textbook/pdf/lemh105.pdf" },
        { name: "Chapter 6: Application of Derivatives", url: "https://ncert.nic.in/textbook/pdf/lemh106.pdf" },
        { name: "Chapter 7: Integrals", url: "https://ncert.nic.in/textbook/pdf/lemh107.pdf" },
        { name: "Chapter 8: Application of Integrals", url: "https://ncert.nic.in/textbook/pdf/lemh108.pdf" },
        { name: "Chapter 9: Differential Equations", url: "https://ncert.nic.in/textbook/pdf/lemh109.pdf" },
        { name: "Chapter 10: Vector Algebra", url: "https://ncert.nic.in/textbook/pdf/lemh110.pdf" },
        { name: "Chapter 11: Three Dimensional Geometry", url: "https://ncert.nic.in/textbook/pdf/lemh111.pdf" },
        { name: "Chapter 12: Linear Programming", url: "https://ncert.nic.in/textbook/pdf/lemh112.pdf" },
        { name: "Chapter 13: Probability", url: "https://ncert.nic.in/textbook/pdf/lemh113.pdf" },
      ] as any,
    },
    Biology: {
      chapters: [
        { name: "Chapter 1: Reproduction in Organisms", url: "https://ncert.nic.in/textbook/pdf/lebo101.pdf" },
        { name: "Chapter 2: Sexual Reproduction in Flowering Plants", url: "https://ncert.nic.in/textbook/pdf/lebo102.pdf" },
        { name: "Chapter 3: Human Reproduction", url: "https://ncert.nic.in/textbook/pdf/lebo103.pdf" },
        { name: "Chapter 4: Reproductive Health", url: "https://ncert.nic.in/textbook/pdf/lebo104.pdf" },
        { name: "Chapter 5: Principles of Inheritance and Variation", url: "https://ncert.nic.in/textbook/pdf/lebo105.pdf" },
        { name: "Chapter 6: Molecular Basis of Inheritance", url: "https://ncert.nic.in/textbook/pdf/lebo106.pdf" },
        { name: "Chapter 7: Evolution", url: "https://ncert.nic.in/textbook/pdf/lebo107.pdf" },
        { name: "Chapter 8: Human Health and Disease", url: "https://ncert.nic.in/textbook/pdf/lebo108.pdf" },
      ] as any,
    },
  },
};

router.get("/chapters", (req, res) => {
  const { classNum, subject } = req.query as { classNum: string; subject: string };
  if (!classNum || !subject) {
    return res.status(400).json({ error: "classNum and subject required" });
  }
  const chapters = NCERT_CHAPTERS[classNum]?.[subject]?.chapters || [];
  res.json({ chapters });
});

export default router;

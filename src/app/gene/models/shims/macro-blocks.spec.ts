import { macroBlocks } from "./macro-blocks";

describe("macroBlocks", () => {

  const referenceTrack = {
    name: "Gm01",
    genes: ["Glyma.01G000100", "Glyma.01G000200", "Glyma.01G000300"],
    families: ["fam1", "fam2", "fam3"],
    genus: "Glycine",
    species: "max",
    source: "lis",
    length: 50000000,
  };

  const genesMap = {
    "Glyma.01G000100": { fmin: 100, fmax: 200, name: "Glyma.01G000100" },
    "Glyma.01G000200": { fmin: 250, fmax: 350, name: "Glyma.01G000200" },
    "Glyma.01G000300": { fmin: 400, fmax: 500, name: "Glyma.01G000300" },
  };

  it("resolves block gene indices to query_start/query_stop coordinates", () => {
    const referenceBlocks = [{
      reference: "Gm01",
      referenceSource: "lis",
      chromosome: "Gm15",
      chromosomeSource: "lis",
      chromosomeGenus: "Glycine",
      chromosomeSpecies: "max",
      blocks: [{
        i: 0,
        j: 2,
        orientation: 1,
        fmin: 100,
        fmax: 300,
      }],
    }];

    const result = macroBlocks(referenceTrack as any, referenceBlocks as any, genesMap as any);
    expect(result.tracks.length).toBe(1);
    expect(result.tracks[0].blocks.length).toBe(1);

    const b = result.tracks[0].blocks[0];
    expect(b.orientation).toBe(1);
    expect(b.start).toBe(100);
    expect(b.stop).toBe(300);
    expect(b.query_start).toBe(100);   // genes[0].fmin
    expect(b.query_stop).toBe(500);    // genes[2].fmax
    expect(result.tracks[0].chromosome).toBe("Gm15");
  });

  it("filters out blocks whose start gene is not in genesMap", () => {
    const referenceBlocks = [{
      reference: "Gm01",
      referenceSource: "lis",
      chromosome: "Gm15",
      chromosomeSource: "lis",
      chromosomeGenus: "Glycine",
      chromosomeSpecies: "max",
      blocks: [
        { i: 0, j: 1, orientation: 1, fmin: 100, fmax: 200 },
      ],
    }];

    const partialMap = {
      // Glyma.01G000100 is MISSING
      "Glyma.01G000200": { fmin: 250, fmax: 350, name: "Glyma.01G000200" },
    };

    const result = macroBlocks(referenceTrack as any, referenceBlocks as any, partialMap as any);
    expect(result.tracks.length).toBe(1);
    expect(result.tracks[0].blocks.length).toBe(0);
  });

  it("filters out blocks whose stop gene is not in genesMap", () => {
    const referenceBlocks = [{
      reference: "Gm01",
      referenceSource: "lis",
      chromosome: "Gm15",
      chromosomeSource: "lis",
      chromosomeGenus: "Glycine",
      chromosomeSpecies: "max",
      blocks: [
        { i: 0, j: 2, orientation: 1, fmin: 100, fmax: 300 },
      ],
    }];

    const partialMap = {
      "Glyma.01G000100": { fmin: 100, fmax: 200, name: "Glyma.01G000100" },
      // Glyma.01G000300 is MISSING
    };

    const result = macroBlocks(referenceTrack as any, referenceBlocks as any, partialMap as any);
    expect(result.tracks.length).toBe(1);
    expect(result.tracks[0].blocks.length).toBe(0);
  });

  it("handles single-gene blocks where i == j", () => {
    const referenceBlocks = [{
      reference: "Gm01",
      referenceSource: "lis",
      chromosome: "Gm15",
      chromosomeSource: "lis",
      chromosomeGenus: "Glycine",
      chromosomeSpecies: "max",
      blocks: [
        { i: 0, j: 0, orientation: 1, fmin: 100, fmax: 100 },
      ],
    }];

    const result = macroBlocks(referenceTrack as any, referenceBlocks as any, genesMap as any);
    expect(result.tracks[0].blocks.length).toBe(1);
    const b = result.tracks[0].blocks[0];
    expect(b.query_start).toBe(100);    // genes[0].fmin
    expect(b.query_stop).toBe(200);     // genes[0].fmax
  });

  it("handles multiple target chromosomes and copies metadata", () => {
    const referenceBlocks = [
      {
        reference: "Gm01",
        referenceSource: "lis",
        chromosome: "Gm15",
        chromosomeSource: "lis",
        chromosomeGenus: "Glycine",
        chromosomeSpecies: "max",
        blocks: [{ i: 0, j: 1, orientation: 1, fmin: 100, fmax: 200 }],
      },
      {
        reference: "Gm01",
        referenceSource: "lis",
        chromosome: "Gm17",
        chromosomeSource: "lis",
        chromosomeGenus: "Glycine",
        chromosomeSpecies: "max",
        blocks: [{ i: 0, j: 2, orientation: -1, fmin: 500, fmax: 700 }],
      },
    ];

    const result = macroBlocks(referenceTrack as any, referenceBlocks as any, genesMap as any);
    expect(result.tracks.length).toBe(2);
    expect(result.tracks[0].chromosome).toBe("Gm15");
    expect(result.tracks[1].chromosome).toBe("Gm17");
    expect(result.tracks[0].blocks[0].orientation).toBe(1);
    expect(result.tracks[1].blocks[0].orientation).toBe(-1);
  });

  it("preserves reference metadata at the top level", () => {
    const referenceBlocks: any[] = [];
    const result = macroBlocks(referenceTrack as any, referenceBlocks, genesMap as any);
    expect(result.chromosome).toBe("Gm01");
    expect(result.length).toBe(50000000);
    expect(result.genus).toBe("Glycine");
    expect(result.species).toBe("max");
    expect(result.source).toBe("lis");
  });

});
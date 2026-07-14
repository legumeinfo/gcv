import {
  microTrackID,
  partialMicroTrackID,
  reducer,
  initialState,
  idArrayLeftDifference,
} from "./micro-tracks.reducer";
import * as microTrackActions from "@gcv/gene/store/actions/micro-tracks.actions";

describe("micro-tracks.reducer — ID functions", () => {

  it("formats full microTrackID as cluster:startGene:stopGene:source", () => {
    expect(microTrackID(1, "geneA", "geneC", "lis"))
      .toBe("1:geneA:geneC:lis");
  });

  it("accepts a Track & ClusterMixin object", () => {
    const track = {
      cluster: 3,
      genes: ["g1", "g2", "g3"],
      source: "gcv",
    };
    // @ts-ignore
    expect(microTrackID(track)).toBe("3:g1:g3:gcv");
  });

  it("formats partial ID as cluster:source", () => {
    expect(partialMicroTrackID(1, "lis")).toBe("1:lis");
  });

  it("accepts a PartialMicroTrackID object", () => {
    expect(partialMicroTrackID({ cluster: 1, source: "lis" }))
      .toBe("1:lis");
  });

});


describe("micro-tracks.reducer — SEARCH state transitions", () => {

  it("SEARCH adds cluster:source to loading when not already loaded", () => {
    const action = new microTrackActions.Search({
      cluster: 1,
      source: "lis",
      families: ["famA"],
      params: {} as any,
    });
    const state = reducer(initialState, action);
    expect(state.loading.length).toBe(1);
    expect(state.loading[0].cluster).toBe(1);
    expect(state.loading[0].source).toBe("lis");
  });

  it("SEARCH is idempotent: duplicate search is deduplicated", () => {
    const action = new microTrackActions.Search({
      cluster: 1,
      source: "lis",
      families: ["famA"],
      params: {} as any,
    });
    const state1 = reducer(initialState, action);
    const state2 = reducer(state1, action);
    expect(state2.loading.length).toBe(1);
  });

  it("SEARCH on an already-loaded cluster is blocked", () => {
    const searchAction = new microTrackActions.Search({
      cluster: 1,
      source: "lis",
      families: ["famA"],
      params: {} as any,
    });
    // First search
    let state = reducer(initialState, searchAction);
    // Success
    state = reducer(state, new microTrackActions.SearchSuccess({
      cluster: 1,
      source: "lis",
      tracks: [],
    }));
    // Second search — should be blocked
    state = reducer(state, searchAction);
    expect(state.loading.length).toBe(0);
  });

  it("SEARCH_SUCCESS clears the loading entry and adds to loaded", () => {
    const searchAction = new microTrackActions.Search({
      cluster: 1,
      source: "lis",
      families: ["famA"],
      params: {} as any,
    });
    let state = reducer(initialState, searchAction);
    expect(state.loading.length).toBe(1);

    state = reducer(state, new microTrackActions.SearchSuccess({
      cluster: 1,
      source: "lis",
      tracks: [],
    }));
    expect(state.loading.length).toBe(0);
    expect(state.loaded.length).toBe(1);
    expect(state.loaded[0].cluster).toBe(1);
    expect(state.loaded[0].source).toBe("lis");
  });

  it("SEARCH_SUCCESS adds tracks to entities", () => {
    const track = {
      cluster: 1,
      genes: ["g1", "g2"],
      families: ["f1", "f2"],
      source: "lis",
      name: "chr1",
      genus: "Glycine",
      species: "max",
      length: 1000000,
    };
    let state = reducer(initialState, new microTrackActions.Search({
      cluster: 1,
      source: "lis",
      families: ["famA"],
      params: {} as any,
    }));
    state = reducer(state, new microTrackActions.SearchSuccess({
      cluster: 1,
      source: "lis",
      tracks: [track as any],
    }));
    const entityId = microTrackID(track as any);
    expect(state.entities[entityId]).toBeDefined();
  });

  it("SEARCH_SUCCESS keeps the first track when two share a microTrackID (addMany does not upsert)", () => {
    // microTrackID is cluster:firstGene:lastGene:source, so these two tracks
    // collide on id. @ngrx/entity's addMany ignores an entity whose id already
    // exists — it does not upsert — so the first track wins on collision.
    const first = {
      cluster: 1, genes: ["g1", "g2", "g3"], families: ["f1", "f2", "f3"],
      source: "lis", name: "first", genus: "Glycine", species: "max", length: 1,
    };
    const collidingLast = {
      cluster: 1, genes: ["g1", "gX", "g3"], families: ["f1", "fX", "f3"],
      source: "lis", name: "second", genus: "Glycine", species: "max", length: 2,
    };
    expect(microTrackID(collidingLast as any)).toBe(microTrackID(first as any));

    let state = reducer(initialState, new microTrackActions.Search({
      cluster: 1, source: "lis", families: ["famA"], params: {} as any,
    }));
    state = reducer(state, new microTrackActions.SearchSuccess({
      cluster: 1, source: "lis", tracks: [first, collidingLast] as any,
    }));

    const id = microTrackID(first as any);
    expect(state.ids.filter((i) => i === id).length).toBe(1);
    expect(state.entities[id].name).toBe("first");   // first wins, not overwritten
  });

  it("SEARCH_FAILURE removes loading and adds to failed", () => {
    const searchAction = new microTrackActions.Search({
      cluster: 1,
      source: "lis",
      families: ["famA"],
      params: {} as any,
    });
    let state = reducer(initialState, searchAction);
    expect(state.loading.length).toBe(1);

    state = reducer(state, new microTrackActions.SearchFailure({
      cluster: 1,
      source: "lis",
      families: ["famA"],
    }));
    expect(state.loading.length).toBe(0);
    expect(state.failed.length).toBe(1);
    expect(state.failed[0].cluster).toBe(1);
    expect(state.failed[0].source).toBe("lis");
  });

  it("CLEAR resets the entire state including entities", () => {
    const searchAction = new microTrackActions.Search({
      cluster: 1,
      source: "lis",
      families: ["famA"],
      params: {} as any,
    });
    let state = reducer(initialState, searchAction);
    state = reducer(state, new microTrackActions.Clear());
    expect(state.loading).toEqual([]);
    expect(state.loaded).toEqual([]);
    expect(state.failed).toEqual([]);
    expect(state.ids).toEqual([]);
    expect(state.entities).toEqual({});
  });

});
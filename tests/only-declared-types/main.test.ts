import { expect, test } from "vitest";
import { test as testUtils } from "../utils.js";

// Should be the same as no-declared-types
test("Test with only declared types", async () => {
    const result = await testUtils(__dirname);
    if(result) {
        const { expectedVisitor, expectedAcceptWeaver, resultVisitor, resultAcceptWeaver } = result;
        expect(resultVisitor).toBe(expectedVisitor);
        expect(resultAcceptWeaver).toBe(expectedAcceptWeaver);
    }
});
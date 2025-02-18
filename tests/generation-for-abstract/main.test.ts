import { expect, test } from "vitest";
import { test as testUtils } from "../utils.js";

// Should have the abstract types in the visitor but not in the accept weaver
test("Test with abstract types", async () => {
    const result = await testUtils(__dirname);
    if(result) {
        const { expectedVisitor, expectedAcceptWeaver, resultVisitor, resultAcceptWeaver } = result;
        expect(resultVisitor).toBe(expectedVisitor);
        expect(resultAcceptWeaver).toBe(expectedAcceptWeaver);
    }
});
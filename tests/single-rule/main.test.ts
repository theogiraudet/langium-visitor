import { expect, test } from "vitest";
import { test as testUtils } from "../utils.js";

test("Test with a single rule", async () => {
    const result = await testUtils(__dirname);
    if(result) {
        const { expectedVisitor, expectedAcceptWeaver, resultVisitor, resultAcceptWeaver } = result;
        expect(resultVisitor).toBe(expectedVisitor);
        expect(resultAcceptWeaver).toBe(expectedAcceptWeaver);
    }
});
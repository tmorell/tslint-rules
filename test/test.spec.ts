import test from "ava";

fdescribe(() => { });

// fdescribe(() => {
//     it(() => { });
// });


// fdescribe(() => {
//     fit(() => { });
// });


fdescribe(() => {
    fit(() => { });
});


function fdescribe(cb: () => void) {
};

function describe(cb: () => void) {
}

function fit(cb: () => void) {
}

function it(cb: () => void) {
}

// test("No filter", () => {

// });

test.only("No filter", () => { });

test.only("No filter", async () => { });

test.serial.only("No filter", () => {

});

// test.skip("No skip", () => { });

// test.serial.skip("No skip", () => { });

// test.skip("No filter", () => {

// });

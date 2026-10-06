(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = api;
    } else {
        root.TrickcalOptimizer = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    function stageNumber(stage) {
        return Number(String(stage).split("-")[1]);
    }

    function compareStages(a, b) {
        return a.area - b.area || stageNumber(a.stage) - stageNumber(b.stage);
    }

    function decimalPlaces(value) {
        const text = String(value).toLowerCase();
        const [coefficient, exponentText = "0"] = text.split("e");
        const fractionLength = (coefficient.split(".")[1] || "").length;
        return Math.max(0, fractionLength - Number(exponentText));
    }

    function normalizeInput(input) {
        const main = Number(input.rates.main);
        const sub = Number(input.rates.sub);
        if (!Number.isFinite(main) || main <= 0 || !Number.isFinite(sub) || sub <= 0) {
            throw new Error("ドロップ期待値は0より大きい有限数を指定してください。");
        }

        const digits = Math.max(
            decimalPlaces(input.rates.main),
            decimalPlaces(input.rates.sub)
        );
        if (digits > 6) {
            throw new Error("ドロップ期待値は小数点以下6桁以内で指定してください。");
        }

        const scale = 10 ** digits;
        return {
            ...input,
            scale,
            mainUnits: Math.round(main * scale),
            subUnits: Math.round(sub * scale),
            mainRate: main,
            subRate: sub
        };
    }

    function materialParts(key) {
        const match = /^R(\d+)_(.+)$/.exec(key);
        return match ? { rank: Number(match[1]), family: match[2] } : null;
    }

    function isUnlocked(stage, maxArea, maxStage) {
        return stage.area < maxArea ||
            (stage.area === maxArea && stageNumber(stage.stage) <= maxStage);
    }

    function solveModel(lpSolver, model) {
        const result = lpSolver.Solve(model);
        if (!result || result.feasible !== true || result.bounded === false) {
            throw new Error("最適な周回計画を確定できませんでした。");
        }
        return result;
    }

    function linearExpression(model, coefficientName) {
        const terms = [];
        for (const [variableName, coefficients] of Object.entries(model.variables)) {
            const coefficient = Number(coefficients[coefficientName] || 0);
            if (coefficient === 0) {
                continue;
            }
            const sign = coefficient < 0 ? "-" : "+";
            terms.push(`${sign} ${Math.abs(coefficient)} ${variableName}`);
        }
        if (terms.length === 0) {
            return "0";
        }
        return terms.join(" ").replace(/^\+ /, "");
    }

    function modelToLp(model) {
        const lines = [
            model.opType === "min" ? "Minimize" : "Maximize",
            ` objective: ${linearExpression(model, model.optimize)}`,
            "Subject To"
        ];

        for (const [name, bound] of Object.entries(model.constraints)) {
            const expression = linearExpression(model, name);
            if (bound.min !== undefined) {
                lines.push(` ${name}: ${expression} >= ${bound.min}`);
            } else if (bound.max !== undefined) {
                lines.push(` ${name}: ${expression} <= ${bound.max}`);
            } else {
                lines.push(` ${name}: ${expression} = ${bound.equal}`);
            }
        }

        const variableNames = Object.keys(model.variables);
        lines.push("Bounds");
        for (const name of variableNames) {
            lines.push(` 0 <= ${name}`);
        }
        if (model.ints && Object.keys(model.ints).length > 0) {
            lines.push("Generals");
            for (const name of Object.keys(model.ints)) {
                lines.push(` ${name}`);
            }
        }
        lines.push("End");
        return lines.join("\n");
    }

    async function createHighsSolver(highsFactory, moduleOptions = {}) {
        if (typeof highsFactory !== "function") {
            throw new Error("整数最適化ソルバーを読み込めませんでした。");
        }
        const highs = await highsFactory(moduleOptions);
        return {
            Solve(model) {
                const solution = highs.solve(modelToLp(model), {
                    presolve: "on",
                    output_flag: false
                });
                const result = {
                    feasible: solution.Status === "Optimal",
                    bounded: solution.Status !== "Unbounded",
                    result: solution.ObjectiveValue
                };
                for (const [name, column] of Object.entries(solution.Columns || {})) {
                    result[name] = column.Primal;
                }
                return result;
            }
        };
    }

    function optimizeFarmingPlan(rawInput, lpSolver) {
        if (!lpSolver || typeof lpSolver.Solve !== "function") {
            throw new Error("整数最適化ソルバーを読み込めませんでした。");
        }

        const input = normalizeInput(rawInput);
        const needs = Object.fromEntries(
            Object.entries(input.needs).filter(([, value]) => Number(value) > 0)
        );
        let stages = input.stages
            .filter(stage => isUnlocked(stage, input.maxArea, input.maxStage))
            .sort(compareStages)
            .map((stage, index) => {
                const yields = {};
                yields[stage.main] = (yields[stage.main] || 0) + input.mainUnits;
                yields[stage.sub] = (yields[stage.sub] || 0) + input.subUnits;
                return { ...stage, yields, variable: `stage_${index}` };
            });

        const unreachable = [];
        const reachableNeeds = {};
        for (const [key, needed] of Object.entries(needs)) {
            if (stages.some(stage => (stage.yields[key] || 0) > 0)) {
                reachableNeeds[key] = Number(needed);
            } else {
                unreachable.push({ key, needed: Number(needed) });
            }
        }

        if (Object.keys(reachableNeeds).length === 0) {
            return { plan: [], unreachable, totalRuns: 0 };
        }

        const requiredKeys = new Set(Object.keys(reachableNeeds));
        const stageByYield = new Map();
        for (const stage of stages) {
            if (!Object.keys(stage.yields).some(key => requiredKeys.has(key))) {
                continue;
            }

            const yieldSignature = Object.entries(stage.yields)
                .sort(([left], [right]) => left.localeCompare(right))
                .map(([key, units]) => `${key}:${units}`)
                .join("|");
            const existing = stageByYield.get(yieldSignature);
            if (!existing ||
                stage.area > existing.area ||
                (stage.area === existing.area &&
                    stageNumber(stage.stage) < stageNumber(existing.stage))) {
                stageByYield.set(yieldSignature, stage);
            }
        }
        stages = [...stageByYield.values()].sort(compareStages);

        const highestRequiredRankByFamily = new Map();
        for (const key of Object.keys(needs)) {
            const part = materialParts(key);
            if (!part) {
                continue;
            }
            const currentHighest = highestRequiredRankByFamily.get(part.family) || 0;
            highestRequiredRankByFamily.set(
                part.family,
                Math.max(currentHighest, part.rank)
            );
        }

        const usefulKeys = new Set();
        for (const stage of stages) {
            for (const key of Object.keys(stage.yields)) {
                const part = materialParts(key);
                const highestRequiredRank = part
                    ? highestRequiredRankByFamily.get(part.family)
                    : undefined;
                if (highestRequiredRank !== undefined &&
                    part.rank >= highestRequiredRank) {
                    usefulKeys.add(key);
                }
            }
        }

        for (const stage of stages) {
            stage.usefulUnits = Object.entries(stage.yields)
                .filter(([key]) => usefulKeys.has(key))
                .reduce((sum, [, units]) => sum + units, 0);
        }

        function buildModel(direction, objectiveFor, fixedRuns, fixedUseful) {
            const constraints = {};
            const needNames = {};
            Object.entries(reachableNeeds).forEach(([key, needed], index) => {
                needNames[key] = `need_${index}`;
                constraints[needNames[key]] = {
                    min: Math.round(needed * input.scale)
                };
            });
            if (fixedRuns !== undefined) {
                constraints.total_runs = { equal: fixedRuns };
            }
            if (fixedUseful !== undefined) {
                constraints.useful_units = { equal: fixedUseful };
            }

            const variables = {};
            const ints = {};
            for (const stage of stages) {
                const variable = { objective: objectiveFor(stage) };
                for (const [key, units] of Object.entries(stage.yields)) {
                    if (needNames[key]) {
                        variable[needNames[key]] = units;
                    }
                }
                if (fixedRuns !== undefined) {
                    variable.total_runs = 1;
                }
                if (fixedUseful !== undefined) {
                    variable.useful_units = stage.usefulUnits;
                }
                variables[stage.variable] = variable;
                ints[stage.variable] = 1;
            }

            return {
                optimize: "objective",
                opType: direction,
                constraints,
                variables,
                ints
            };
        }

        const primary = solveModel(lpSolver, buildModel("min", () => 1));
        const bestRuns = Math.round(primary.result);

        const hasUsefulOutput = stages.some(stage => stage.usefulUnits > 0);
        let bestUseful = 0;
        if (hasUsefulOutput) {
            const secondary = solveModel(
                lpSolver,
                buildModel("max", stage => stage.usefulUnits, bestRuns)
            );
            bestUseful = Math.round(secondary.result);
        }

        const finalResult = solveModel(
            lpSolver,
            buildModel("max", stage => stage.area, bestRuns, bestUseful)
        );

        const selected = [];
        const produced = {};
        let actualRuns = 0;
        for (const stage of stages) {
            const rawRuns = Number(finalResult[stage.variable] || 0);
            const runs = Math.round(rawRuns);
            if (Math.abs(rawRuns - runs) > 1e-7 || runs < 0) {
                throw new Error("ソルバーが整数でない周回数を返しました。");
            }
            if (runs === 0) {
                continue;
            }

            actualRuns += runs;
            for (const [key, units] of Object.entries(stage.yields)) {
                produced[key] = (produced[key] || 0) + units * runs;
            }
            selected.push({
                stage: stage.stage,
                area: stage.area,
                main: stage.main,
                sub: stage.sub,
                runs,
                expectedMain: runs * input.mainRate,
                expectedSub: runs * input.subRate
            });
        }

        if (actualRuns !== bestRuns) {
            throw new Error("ソルバー結果の総周回数が最適値と一致しません。");
        }
        for (const [key, needed] of Object.entries(reachableNeeds)) {
            if ((produced[key] || 0) < Math.round(needed * input.scale)) {
                throw new Error(`必要素材 ${key} を満たさない解を拒否しました。`);
            }
        }

        selected.sort((a, b) =>
            b.area - a.area || stageNumber(a.stage) - stageNumber(b.stage));
        return { plan: selected, unreachable, totalRuns: actualRuns };
    }

    return {
        optimizeFarmingPlan,
        createHighsSolver,
        modelToLp
    };
});

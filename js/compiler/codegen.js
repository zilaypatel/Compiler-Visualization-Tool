/**
 * Compiler Visualization Tool - Target Code Generator
 * Translates Three-Address Code / Quadruples into clean, educational
 * RISC-style Assembly for a Virtual Register Machine with instruction annotations.
 */

export class AssemblyInstruction {
  constructor(address, opcode, operands, comment) {
    this.address = address;
    this.opcode = opcode;
    this.operands = operands;
    this.comment = comment;
  }

  toString() {
    const formattedAddr = String(this.address).padStart(4, "0");
    const opStr = `${this.opcode.padEnd(8, " ")} ${this.operands}`.padEnd(28, " ");
    return `${formattedAddr}:  ${opStr} ; ${this.comment}`;
  }
}

export class CodeGenerator {
  constructor() {
    this.instructions = [];
    this.regCount = 4; // R0, R1, R2, R3
    this.registerDescriptors = new Map(); // Reg -> Variable/Temp
    this.variableLocations = new Map(); // Var -> Reg or Memory
  }

  generate(quadruples) {
    this.instructions = [];
    let address = 0;

    const emit = (opcode, operands, comment) => {
      const instr = new AssemblyInstruction(address, opcode, operands, comment);
      this.instructions.push(instr);
      address += 4;
    };

    if (!quadruples || quadruples.length === 0) {
      return { instructions: [], formatted: "" };
    }

    emit("START", "", "Program entry point");

    for (const q of quadruples) {
      const { op, arg1, arg2, result } = q;

      // 1. Assignment: result = arg1
      if (op === "=") {
        if (!isNaN(parseFloat(arg1))) {
          emit("LOADI", `R0, #${arg1}`, `Load constant ${arg1} into register R0`);
        } else {
          emit("LOAD", `R0, [${arg1}]`, `Load value of '${arg1}' from memory into R0`);
        }
        emit("STORE", `[${result}], R0`, `Store register R0 into variable '${result}'`);
        continue;
      }

      // 2. Unary operations
      if (op.startsWith("unary_")) {
        const realOp = op.replace("unary_", "");
        if (!isNaN(parseFloat(arg1))) {
          emit("LOADI", `R0, #${arg1}`, `Load immediate ${arg1} into R0`);
        } else {
          emit("LOAD", `R0, [${arg1}]`, `Load '${arg1}' into R0`);
        }
        if (realOp === "-") {
          emit("NEG", "R0", `Negate value in R0`);
        }
        emit("STORE", `[${result}], R0`, `Store result into temporary '${result}'`);
        continue;
      }

      // 3. Binary operations: result = arg1 op arg2
      // Load arg1 into R0
      if (!isNaN(parseFloat(arg1))) {
        emit("LOADI", `R0, #${arg1}`, `Load constant ${arg1} into R0`);
      } else {
        emit("LOAD", `R0, [${arg1}]`, `Load '${arg1}' into R0`);
      }

      // Load arg2 into R1
      if (!isNaN(parseFloat(arg2))) {
        emit("LOADI", `R1, #${arg2}`, `Load constant ${arg2} into R1`);
      } else {
        emit("LOAD", `R1, [${arg2}]`, `Load '${arg2}' into R1`);
      }

      // Perform ALU arithmetic
      switch (op) {
        case "+":
          emit("ADD", "R0, R1", `R0 = R0 + R1`);
          break;
        case "-":
          emit("SUB", "R0, R1", `R0 = R0 - R1`);
          break;
        case "*":
          emit("MUL", "R0, R1", `R0 = R0 * R1`);
          break;
        case "/":
          emit("DIV", "R0, R1", `R0 = R0 / R1`);
          break;
        case "%":
          emit("MOD", "R0, R1", `R0 = R0 % R1`);
          break;
        case "^":
          emit("POW", "R0, R1", `R0 = R0 ^ R1`);
          break;
        default:
          emit("ALU", `R0, ${op}, R1`, `Compute R0 ${op} R1`);
          break;
      }

      // Store result
      emit("STORE", `[${result}], R0`, `Save result into '${result}'`);
    }

    emit("HALT", "", "Stop processor execution");

    return {
      instructions: this.instructions,
      formatted: this.instructions.map(i => i.toString()).join("\n")
    };
  }
}

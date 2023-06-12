import { BigNumber } from "ethers";

export function safeDiv(a: BigNumber, b: BigNumber): BigNumber {
  const quotient = a.div(b)
  if (a.mul(10).div(b).abs().mod(10).gte(5)) {
    if (quotient.lt(0)) {
      return quotient.sub(1)
    }
    return quotient.add(1)
  }
  return quotient
}
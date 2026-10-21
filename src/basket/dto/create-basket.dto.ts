import { IsOptional, IsString, Matches, MaxLength } from "class-validator";
import {
  POSTAL_CODE_MESSAGE,
  POSTAL_CODE_PATTERN,
} from "./postal-code-pattern.js";

export class CreateBasketDto {
  @IsOptional()
  @IsString()
  @MaxLength(10)
  @Matches(POSTAL_CODE_PATTERN, { message: POSTAL_CODE_MESSAGE })
  postalCode?: string;
}

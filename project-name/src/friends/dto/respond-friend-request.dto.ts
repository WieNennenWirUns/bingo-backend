import { IsBoolean, IsInt } from 'class-validator';

export class RespondFriendRequestDto {
  @IsInt()
  requestId: number;

  @IsBoolean()
  accept: boolean;
}

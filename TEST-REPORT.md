# 자동 검사 기록 · 2026-09-30

실제 게임 엔진을 실행한 자동 검사입니다. 사람의 플레이 및 실제 브라우저 검사와 구분합니다.

## 통과한 검사
- PC boundaries: all four edges / diagonal normalization
- Damage, invulnerability and loss
- Special: damage, bullets cleared, charge consumed
- Five bosses, final phase 2, final clear
- Laser warning before active damage
- Fresh, corrupt, blocked storage, reset and valid records
- Deterministic A/B: only enemy bullet velocity differs
- 600 seconds / 36,000 simulation frames: finite state, bounded objects, repeated restarts
- Full five-stage clear from fresh state using legal movement and special inputs: seeds 65 and 76

## 적 탄환 속도 비교 · 자동 조작 20회

A/B 10쌍. 한 쌍은 같은 seed와 같은 조작 알고리즘 사용. 변경 값은 적 탄환 속도 배수 하나.

| 구분 | 탄환 속도 | 횟수 | 평균 점수 | 평균 생존시간 | 30초 생존 |
|---|---:|---:|---:|---:|---:|
| A | ×1.00 | 10 | 3830 | 26.51초 | 5 |
| B | ×1.25 | 10 | 2945 | 23초 | 1 |

자동 결과에서는 A에서 생존시간과 생존 횟수가 더 높았습니다. 일반 작전의 시작 값은 A(×1.00)로 설정했습니다. 이는 자동 조작 결과에 따른 초기 설정이며 사람의 체감 난이도 결론은 아닙니다.

## 최종 클리어 확인

일반 입력만 사용하는 자동 조작으로 seed 65와 76에서 5스테이지 최종보스 격파와 MISSION COMPLETE 상태를 확인했습니다. 이 검사에서는 HP/무적/스테이지를 강제로 변경하지 않았습니다.

## 지속 실행

600초에 해당하는 36,000 프레임을 빠르게 시뮬레이션했습니다. 종료 후 재시작 5회, 동시 객체 최대 123개. 좌표 유한성 및 객체 누적 제한을 통과했습니다. 실제 10분 경과나 브라우저 화면/메모리 검사는 아닙니다.

## 사용자가 직접 확인할 항목

- [ ] PC에서 위/아래/왼쪽/오른쪽과 대각선으로 이동해 화면 밖으로 나가지 않는지 확인.
- [ ] 10분 동안 브라우저에서 반복 플레이/재시작. 시간, 끊김 여부와 오류 여부 기록. 탭을 닫거나 숨기면 자동 일시정지.
- [ ] 시험 비행 20회(A 10회+B 10회)를 직접 완료하고 CSV 보관.
- [ ] 기록 초기화 후 최고점수 0과 빈 기록 확인.
- [ ] 개발자 도구 콘솔에서 `localStorage.setItem("sky-striker-v1", "broken")` 실행 후 새로고침. 복구 안내와 기본값 확인.
- [ ] 효과음/화면 효과 OFF, 키보드/터치 조작, 새로고침 후 저장 확인.
- [ ] 시크릿 창에서 공개 URL이 로그인 없이 열리는지 확인.

이 환경에서는 브라우저 화면 검증을 수행할 수 없었습니다. 위 항목을 완료하기 전에는 직접 검사했다고 제출하지 마세요.

## 스테이지 배경 / 최종보스 수정 후 검증
- 각 배경을 원본 캔버스 렌더러로 0/20/1000초 및 효과 ON/OFF에서 실행하고 5종 배경과 탄환 대비를 이미지로 확인했습니다. 전체 브라우저 UI 검사는 아닙니다.
- 기존 게임 엔진 검사를 다시 통과했습니다. A/B 시험 비행 결과는 동일합니다.
- 더 빨라진 최종보스도 seed 65와 76에서 일반 입력만으로 전체 5스테이지 클리어했습니다.

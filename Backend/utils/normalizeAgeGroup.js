// utils/normalizeAgeGroup.js
function normalizeAgeGroup(age) {
    if (['중1','중2','중3'].includes(age)) return '중학생';
    if (['고1','고2','고3'].includes(age)) return '고등학생';
    return age; // 이미 '중학생', '고등학생', '20대' 같은 값이면 그대로
  }
  
  module.exports = normalizeAgeGroup;
  
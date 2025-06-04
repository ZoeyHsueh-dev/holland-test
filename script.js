// 全局變量
let situationQuestions = [];
let activityQuestions = [];
let hollandTypeDescriptions = {};
let currentScores = {}; // 新增全局變量來存儲當前分數

// 從外部文件加載測驗數據
async function loadTestData() {
  try {
    const response = await fetch('questions.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // 設置全局變量
    situationQuestions = data.situationQuestions;
    activityQuestions = data.activityQuestions;
    hollandTypeDescriptions = data.typeDescriptions;
    
    console.log("測驗數據加載成功");
    
    // 初始化測驗
    initTest();
    
    // 從URL參數載入結果（如果有）
    loadResultsFromURL();
  } catch (error) {
    console.error("加載測驗數據時出錯:", error);
    document.getElementById('test-introduction').innerHTML = `
      <h2>加載測驗數據時出錯</h2>
      <p>抱歉，加載測驗數據時發生錯誤。請稍後再試。</p>
      <p>錯誤詳情: ${error.message}</p>
    `;
  }
}

// 初始化測驗
function initTest() {
  // 設置事件監聽器
  document.getElementById('start-test').addEventListener('click', startTest);
  document.getElementById('next-to-activity').addEventListener('click', showActivitySection);
  document.getElementById('submit-test').addEventListener('click', submitTest);
  document.getElementById('copy-results').addEventListener('click', copyTestResults);
}

// 在頁面加載時執行
document.addEventListener('DOMContentLoaded', function() {
  // 設置年份
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // 加載測驗數據
  loadTestData();
});

// 開始測驗
function startTest() {
  document.getElementById('test-introduction').classList.add('hidden');
  document.getElementById('situation-section').classList.remove('hidden');
  
  // 生成情境問題
  generateSituationQuestions();
  updateProgressBar(1, 3);
  
  // 滾動到頁面頂部
  window.scrollTo(0, 0);
}

// 更新進度條
function updateProgressBar(current, total) {
  const progressBar = document.getElementById('progress-bar');
  const percentage = (current / total) * 100;
  progressBar.style.width = percentage + '%';
}

// 生成情境問題
function generateSituationQuestions() {
  const container = document.getElementById('situation-questions');
  container.innerHTML = '';
  
  situationQuestions.forEach((question, index) => {
    // 創建問題元素
    const questionElement = document.createElement('div');
    questionElement.className = 'question';
    questionElement.innerHTML = `<p class="question-text">${index + 1}. ${question.question}</p>`;
    
    // 創建選項
    const optionsElement = document.createElement('div');
    optionsElement.className = 'options';
    
    question.options.forEach((option, optionIndex) => {
      const optionElement = document.createElement('div');
      optionElement.className = 'option';
      optionElement.innerHTML = `
        <input type="radio" id="q${index}_opt${optionIndex}" name="q${index}" value="${option.type}">
        <label for="q${index}_opt${optionIndex}">${option.text}</label>
      `;
      optionsElement.appendChild(optionElement);
      
      // 添加事件監聽器
      optionElement.querySelector('input').addEventListener('change', checkSituationCompletion);
    });
    
    questionElement.appendChild(optionsElement);
    container.appendChild(questionElement);
  });
}

// 檢查情境問題是否全部回答
function checkSituationCompletion() {
  const allAnswered = [...document.querySelectorAll('#situation-questions .question')].every(
    question => [...question.querySelectorAll('input')].some(input => input.checked)
  );
  
  document.getElementById('next-to-activity').disabled = !allAnswered;
}

// 顯示活動偏好部分
function showActivitySection() {
  document.getElementById('situation-section').classList.add('hidden');
  document.getElementById('activity-section').classList.remove('hidden');
  
  // 生成活動問題
  generateActivityQuestions();
  updateProgressBar(2, 3);
  
  // 滾動到頁面頂部
  window.scrollTo(0, 0);
}

// 生成活動偏好問題
function generateActivityQuestions() {
  const container = document.getElementById('activity-questions');
  container.innerHTML = '';
  
  activityQuestions.forEach((question, index) => {
    const questionElement = document.createElement('div');
    questionElement.className = 'activity-question';
    questionElement.innerHTML = `
      <p class="activity-text">${index + 1}. ${question.activity}</p>
      <div class="rating">
        <span>不像我</span>
        <div class="rating-options">
          ${[1, 2, 3, 4, 5].map(value => `
            <div class="rating-option">
              <input type="radio" id="act${index}_rate${value}" name="act${index}" value="${value}" data-type="${question.type}">
              <label for="act${index}_rate${value}">${value}</label>
            </div>
          `).join('')}
        </div>
        <span>很像我</span>
      </div>
    `;
    
    container.appendChild(questionElement);
    
    // 添加事件監聽器
    questionElement.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', checkActivityCompletion);
    });
  });
}

// 檢查活動問題是否全部回答
function checkActivityCompletion() {
  const allAnswered = [...document.querySelectorAll('#activity-questions .activity-question')].every(
    question => [...question.querySelectorAll('input')].some(input => input.checked)
  );
  
  document.getElementById('submit-test').disabled = !allAnswered;
}

// 提交測驗
function submitTest() {
  // 計算分數
  const scores = calculateScores();
  currentScores = scores; // 保存分數到全局變量
  
  // 更新進度條
  updateProgressBar(3, 3);
  
  // 顯示結果
  showResults(scores);
  
  // 保存結果到localStorage（替代Google Apps Script的數據儲存）
  localStorage.setItem('hollandResults', JSON.stringify({
    scores: scores,
    timestamp: new Date().toISOString()
  }));
  
  // 不再更新URL參數，保持乾淨的URL
}

// 計算分數
function calculateScores() {
  const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
  
  // 計算情境問題分數
  document.querySelectorAll('#situation-questions input:checked').forEach(input => {
    scores[input.value]++;
  });
  
  // 計算活動問題分數
  document.querySelectorAll('#activity-questions input:checked').forEach(input => {
    scores[input.dataset.type] += parseInt(input.value);
  });
  
  return scores;
}

// 顯示結果
function showResults(scores) {
  document.getElementById('activity-section').classList.add('hidden');
  document.getElementById('results-section').style.display = 'flex';
  
  // 生成圖表
  generateScoreChart(scores);
  
  // 顯示最高分數類型
  showTopTypes(scores);
  
  // 不再調用 showAllScores
  // showAllScores(scores);
  
  // 顯示人格描述
  showHollandDescription(scores);
  
  // 滾動到頁面頂部
  window.scrollTo(0, 0);
}

// 生成分數圖表
function generateScoreChart(scores) {
  const ctx = document.getElementById('score-chart').getContext('2d');
  
  // 清除之前的圖表（如果有）
  if (window.scoreChart) {
    window.scoreChart.destroy();
  }
  
  window.scoreChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: [
        '實踐者 (R)', 
        '思考者 (I)', 
        '創造者 (A)', 
        '助人者 (S)', 
        '影響者 (E)', 
        '組織者 (C)'
      ],
      datasets: [{
        label: '您的分數',
        data: [scores.R, scores.I, scores.A, scores.S, scores.E, scores.C],
        backgroundColor: 'rgba(175, 193, 162, 0.2)',
        borderColor: 'rgba(175, 193, 162, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(175, 193, 162, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          labels: {
            font: {
              size: 16 // 增加圖例字體大小
            }
          }
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 30,
          ticks: {
            stepSize: 5,
            display: false // 隱藏刻度數字以減少雜亂
          },
          pointLabels: {
            font: {
              size: 16, // 增加軸標籤字體大小
              weight: 'bold' // 加粗字體
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)' // 使網格線更淡
          },
          angleLines: {
            color: 'rgba(0, 0, 0, 0.1)' // 使角度線更淡
          }
        }
      }
    }
  });
}

// 顯示最高分數類型
function showTopTypes(scores) {
  const topTypesContainer = document.getElementById('top-types');
  
  // 計算總分
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  // 將分數轉換為數組並排序（從高到低）
  const scoreArray = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  // 獲取前三高的類型（僅用於類型代碼）
  const topThree = scoreArray.slice(0, 3);
  
  // 創建最高分數類型的代碼
  const code = topThree.map(item => item[0]).join('');
  
  // 顯示結果
  topTypesContainer.innerHTML = `
    <h3>你的主要興趣類型</h3>
    <div class="type-code">${code}</div>
    <div class="top-types-list">
      ${scoreArray.map(([type, score]) => {
        const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
        return `
          <div class="top-type">
            <div class="type-name">${hollandTypeDescriptions[type].name}</div>
            <div class="type-score">${percentage}%</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// 顯示所有分數（已移除此函數調用）
function showAllScores(scores) {
  const scoresContainer = document.getElementById('scores-container');
  scoresContainer.innerHTML = '';
  
  const types = [
    { code: 'R', name: '實踐者 (Realistic)' },
    { code: 'I', name: '思考者 (Investigative)' },
    { code: 'A', name: '創造者 (Artistic)' },
    { code: 'S', name: '助人者 (Social)' },
    { code: 'E', name: '影響者 (Enterprising)' },
    { code: 'C', name: '組織者 (Conventional)' }
  ];
  
  // 計算總分
  const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  const scoreBarContainer = document.createElement('div');
  scoreBarContainer.className = 'score-bars';
  
  types.forEach(type => {
    const score = scores[type.code];
    const percentage = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
    
    const scoreBar = document.createElement('div');
    scoreBar.className = 'score-bar';
    scoreBar.innerHTML = `
      <div class="score-label">${type.name}</div>
      <div class="bar-container">
        <div class="bar" style="width: ${percentage}%"></div>
      </div>
      <div class="score-value">${percentage}%</div>
    `;
    
    scoreBarContainer.appendChild(scoreBar);
  });
  
  scoresContainer.appendChild(scoreBarContainer);
}

// 顯示人格描述 - 移除了職業部分
function showHollandDescription(scores) {
  const descriptionContainer = document.getElementById('holland-description');
  
  // 將分數轉換為數組並排序（從高到低）
  const scoreArray = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  
  // 獲取前三高的類型（或根據分數顯示主要類型）
  // 我們篩選出分數至少為 5 的類型，這確保只顯示有意義的類型
  // 如果沒有足夠的類型達到這個門檻，我們最多顯示前 3 個
  let significantTypes = scoreArray.filter(([_, score]) => score >= 5);
  if (significantTypes.length === 0) {
    significantTypes = scoreArray.slice(0, 3);
  } else if (significantTypes.length > 3) {
    significantTypes = significantTypes.slice(0, 3);
  }
  
  // 創建結果 HTML
  let resultHTML = `<h3>你的主要人格特質</h3>`;
  
  // 為每個主要類型添加詳細描述，但不包括職業
  significantTypes.forEach(([type, score], index) => {
    const typeInfo = hollandTypeDescriptions[type];
    
    resultHTML += `
      <div class="type-description-block">
        <h4>${index + 1}. ${typeInfo.name} (${score}分)</h4>
        <p class="type-description">${typeInfo.description}</p>
        
        <div class="strengths-container">
          <h5>優勢特質</h5>
          <div class="strengths-list">
            ${typeInfo.strengths.map(strength => `<span class="strength-tag">${strength}</span>`).join('')}
          </div>
        </div>
      </div>
      ${index < significantTypes.length - 1 ? '<hr class="type-divider">' : ''}
    `;
  });
  
  // 設置 HTML 內容
  descriptionContainer.innerHTML = resultHTML;
}

// 複製測驗結果函數
function copyTestResults() {
  // 根據分數從高到低排序生成結果字串
  const scoreArray = Object.entries(currentScores).sort((a, b) => b[1] - a[1]);
  const resultString = scoreArray.map(([type, score]) => `${type}${score}`).join('');
  
  navigator.clipboard.writeText(resultString)
    .then(() => {
      // 顯示複製成功反饋
      const feedback = document.getElementById('copy-feedback');
      feedback.classList.remove('hidden');
      
      // 3秒後隱藏反饋
      setTimeout(() => {
        feedback.classList.add('hidden');
      }, 3000);
    })
    .catch(err => {
      console.error('無法複製測驗結果: ', err);
      // 如果複製失敗，顯示錯誤訊息
      const feedback = document.getElementById('copy-feedback');
      feedback.textContent = '複製失敗，請手動選取結果';
      feedback.classList.remove('hidden');
      
      setTimeout(() => {
        feedback.textContent = '✓ 測驗結果已複製到剪貼簿';
        feedback.classList.add('hidden');
      }, 3000);
    });
}

// 從URL載入結果 - 現在改為從localStorage載入
function loadResultsFromURL() {
  // 檢查localStorage中是否有結果
  const savedResults = localStorage.getItem('hollandResults');
  if (savedResults) {
    try {
      const data = JSON.parse(savedResults);
      const scores = data.scores;
      
      // 檢查結果是否在合理時間內（例如1小時內）
      const timestamp = new Date(data.timestamp);
      const now = new Date();
      const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
      
      if (hoursDiff <= 1 && scores) {
        currentScores = scores;
        showResults(scores);
      }
    } catch (error) {
      console.error('載入儲存的結果時出錯:', error);
    }
  }
}

import { useMemo, useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './index.css'

export default function App() {
  const servers = [
    { id: 'main', name: '왕혈', password: '0529' },
    { id: 'server2', name: '킹연합', password: '1818' },
    { id: 'server3', name: '서버3', password: '1234' },
    { id: 'server4', name: '데컨 어벤져스', password: '0604' },
    { id: 'server5', name: '서버5', password: '1234' },
    { id: 'server6', name: '서버6', password: '1234' },
    { id: 'server7', name: '서버7', password: '1234' },
  ]

  const makeMember = (name) => ({
    name,
    unpaid: 0,
    total: 0,
    attendance: 0,
  })

  const initialGroups = {
    기사: [
      '데스나이트', '옹박', 'SB', '돌산', '돌산나라', '돌산부주',
      '사각김밥', '쿠자룡', '스타링크', 'Kkyu', '낼', '이사장(정사장님)',
      '깐도리', '린저씨', '바쿠', '수라', '엄푸', '장용석', '혈기사',
      '유이진', '흑장로', '지건후', '찐빠', '최사장', '쿠지', 'v혼v',
      '선예', '선예 부주', '린저씨(달자)', '징벌', '꼬마', '꼬마 부주',
      '나는', '류왕', '자갱', '최사장(동생)', '마석대',
    ].map(makeMember),

    요정: [
      '발트리스', '부엉이v', '송태섭', '슬슬약올리기', '싼타',
      '아라윤슬', '신루이', '활부엉', '콘초', '포노스', '불', 'EXO',
      '내무부장관', '단팥빵', '부라보', '삼고초려88', '삼고초려86', '활',
    ].map(makeMember),

    법사: [
      '귀로', '쿠거', '백색', '서큐버스', '시즈', 'POISON', '조과',
      '지건후(신사)', '김바니', '냐금', '레빈', '무법', '무법부주',
      '요원화', '크릉', '약탈자', '약탈자(슬슬)',
    ].map(makeMember),

    미확인: [
      '각서', '구데기', '국토부장관', '그냥패', '깐도리', '꺼드럭',
      '느림보', '동백낭', 'Tei', '님아힐좀요', '베놈', '봉알', '성북',
      '수정이', '쉿', '싼마이', '언체인', '카오야', '음월', '일체',
      '정주행', '지맨', '지용', '찌거기', '참돔', '천군천사', '청월',
      '크독', '테이오', '팜하니', '포맨', '호린', '화나', 'AIA',
      'Encho', 'GD',
    ].map(makeMember),
  }

  const emptyGroups = {
    기사: [],
    요정: [],
    법사: [],
    미확인: [],
  }

  const getDefaultGroups = (serverId) => (
    serverId === 'main' ? initialGroups : emptyGroups
  )

  const bossTimes = [
    '01시', '03시', '05시', '06시', '07시', '09시', '11시', '12시',
    '13시', '15시', '17시', '18시', '19시', '21시', '22시', '24시',
  ]

  const bosses = ['커츠', '이프리트', '드레이크', '바포메트', '카스파', '네크로맨서']

  const itemList = [
    '쇼크스턴', '리덕션아머', '바운스어택', '솔리드케이지',
    '캔슬레이션', '라이트닝스톰', '파이어스톰', '홀리워크',
    '선버스트', '트리플 애로우', '블러드 투 소울', '블레스 오브 어스',
    '아이 오브 스톰', '블레스 오브 파이어', '순간이동조종반지',
    '변신조종반지', '발터자르의 모자', '메르키오르의 모자',
    '지식의 목걸이', '완력의 목걸이', '축데이', '축젤'
  ]

  const [groups, setGroups] = useState(initialGroups)
  const [selectedMembers, setSelectedMembers] = useState([])
  const [raidHistory, setRaidHistory] = useState([])
  const [paymentHistory, setPaymentHistory] = useState([])
  const [selectedPayoutMembers, setSelectedPayoutMembers] = useState([])
  const [selectedPaymentHistory, setSelectedPaymentHistory] = useState([])
  const [activeTab, setActiveTab] = useState('input')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [selectedServerId, setSelectedServerId] = useState('main')
  const [passwordInput, setPasswordInput] = useState('')
  const [selectedRaid, setSelectedRaid] = useState(null)
  const [editingIndex, setEditingIndex] = useState(null)

  const [date, setDate] = useState('')
  const [time, setTime] = useState('21시')
  const [boss, setBoss] = useState('커츠')
  const [selectedItem, setSelectedItem] = useState('')
  const [adena, setAdena] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [showMemberManager, setShowMemberManager] = useState(false)

  const [newMembers, setNewMembers] = useState(
    Array.from({ length: 9 }, () => ({ name: '', group: '기사' }))
)

  const [selectedDeleteMembers, setSelectedDeleteMembers] = useState([])

  const [editingMember, setEditingMember] = useState(null)
  const [editingMemberName, setEditingMemberName] = useState('')  

  const [draggedMember, setDraggedMember] = useState(null)
  const [draggedGroup, setDraggedGroup] = useState(null)

  const participantCount = selectedMembers.length

  const perPerson = useMemo(() => {
    const amount = Number(adena || 0)
    if (!amount || participantCount === 0) return 0
    return Math.floor(amount / participantCount)
  }, [adena, participantCount])

  const formatNumber = (value) => Number(value || 0).toLocaleString()

  const getParticipationRate = (member) => {
    if (raidHistory.length === 0) return 0
    return Math.floor((member.attendance / raidHistory.length) * 100)
  }

  const getAllMembers = () => {
    return Object.entries(groups).flatMap(([groupName, members]) =>
      members.map((member) => ({ ...member, groupName }))
    )
  }

  const searchedMembers = getAllMembers()
    .filter((member) =>
      memberSearch &&
      member.name.toLowerCase().includes(memberSearch.toLowerCase())
    )
    .slice(0, 10)

  const recalculateGroups = (historyList, payments = paymentHistory, baseGroups = groups) => {
  const resetGroups = {}

  Object.keys(baseGroups).forEach((groupName) => {
    resetGroups[groupName] = baseGroups[groupName].map((member) => ({
      ...member,
      unpaid: 0,
      total: 0,
      attendance: 0,
    }))
  })

  historyList.forEach((raid) => {
    Object.keys(resetGroups).forEach((groupName) => {
      resetGroups[groupName] = resetGroups[groupName].map((member) => {
        if (raid.participants.includes(member.name)) {
          return {
            ...member,
            unpaid: member.unpaid + raid.perPerson,
            total: member.total + raid.perPerson,
            attendance: member.attendance + 1,
          }
        }

        return member
      })
    })
  })

  payments.forEach((payment) => {
    Object.keys(resetGroups).forEach((groupName) => {
      resetGroups[groupName] = resetGroups[groupName].map((member) => {
        if (member.name === payment.memberName) {
          return {
            ...member,
            unpaid: Math.max(0, member.unpaid - payment.amount),
          }
        }

        return member
      })
    })
  })

  setGroups(resetGroups)
  return resetGroups
}

  const toggleMember = (memberName) => {
    setSelectedMembers((prev) =>
      prev.includes(memberName)
        ? prev.filter((m) => m !== memberName)
        : [...prev, memberName]
    )
  }

  const addMembers = async () => {
  const updated = {
    기사: [...(groups.기사 || [])],
    요정: [...(groups.요정 || [])],
    법사: [...(groups.법사 || [])],
    미확인: [...(groups.미확인 || [])],
  }

  let addedCount = 0

  const namesToAdd = []

  newMembers.forEach((member) => {
    const name = member.name.trim()
    const groupName = member.group || '미확인'

    if (!name) return

    const alreadyExists = Object.values(updated)
      .flat()
      .some((m) => m.name === name)

    if (alreadyExists) {
       alert(`${name}은 이미 있는 닉네임입니다.`)
    return
    }

    if (namesToAdd.includes(name)) {
       alert(`${name}은 이미 입력한 닉네임입니다.`)
    return
    }

    namesToAdd.push(name)

    updated[groupName].push({
      name,
      unpaid: 0,
      total: 0,
      attendance: 0,
    })

    addedCount += 1
  })

  if (addedCount === 0) {
    alert('추가할 혈원명이 없거나 이미 존재하는 이름입니다.')
    return
  }

  const recalculated = recalculateGroups(
    raidHistory,
    paymentHistory,
    updated
  )

  const saved = await saveData(
    recalculated,
    raidHistory,
    paymentHistory
  )

  if (!saved) return

  setNewMembers(
    Array.from({ length: 10 }, () => ({ name: '', group: '기사' }))
  )

  alert(`${addedCount}명 혈원 추가 완료`)
}

const updateMemberName = async () => {
  if (!editingMember) return

  const newName = editingMemberName.trim()

  if (!newName) {
    alert('혈원명을 입력하세요')
    return
  }

  const updated = {
    기사: [...(groups.기사 || [])],
    요정: [...(groups.요정 || [])],
    법사: [...(groups.법사 || [])],
    미확인: [...(groups.미확인 || [])],
  }

  Object.keys(updated).forEach((groupName) => {
    updated[groupName] = updated[groupName].map((member) => {
      if (member.name === editingMember.name) {
        return {
          ...member,
          name: newName,
        }
      }

      return member
    })
  })

  const updatedRaidHistory = raidHistory.map((raid) => ({
    ...raid,
    participants: raid.participants.map((name) =>
      name === editingMember.name ? newName : name
    ),
  }))

  const updatedPaymentHistory = paymentHistory.map((payment) =>
    payment.memberName === editingMember.name
      ? { ...payment, memberName: newName }
      : payment
  )

  const recalculated = recalculateGroups(
    updatedRaidHistory,
    updatedPaymentHistory,
    updated
  )

  setRaidHistory(updatedRaidHistory)
  setPaymentHistory(updatedPaymentHistory)

  const saved = await saveData(
    recalculated,
    updatedRaidHistory,
    updatedPaymentHistory
  )

  if (!saved) return

  setEditingMember(null)
  setEditingMemberName('')

  alert('혈원 수정 완료')
}

const deleteSelectedMembers = async () => {
  if (selectedDeleteMembers.length === 0) {
    alert('삭제할 혈원을 선택하세요')
    return
  }

  if (!confirm('선택한 혈원을 삭제할까요? 기존 회차/지급 히스토리의 이름 기록은 유지됩니다.')) {
    return
  }

  const updated = {}

  Object.keys(groups).forEach((groupName) => {
    updated[groupName] = groups[groupName].filter(
      (member) => !selectedDeleteMembers.includes(member.name)
    )
  })

  const recalculated = recalculateGroups(
    raidHistory,
    paymentHistory,
    updated
  )

  const saved = await saveData(
    recalculated,
    raidHistory,
    paymentHistory
  )

  if (!saved) return

  setSelectedDeleteMembers([])
  setSelectedMembers((prev) =>
    prev.filter((name) => !selectedDeleteMembers.includes(name))
  )

  alert('혈원 삭제 완료')
}

  const dragStart = (member, group) => {
    setDraggedMember(member)
    setDraggedGroup(group)
  }

  const dropMember = (targetGroup) => {
    if (!draggedMember || !draggedGroup) return
    if (draggedGroup === targetGroup) return

    const updated = { ...groups }

    updated[draggedGroup] = updated[draggedGroup].filter(
      (m) => m.name !== draggedMember.name
    )

    updated[targetGroup] = [...updated[targetGroup], draggedMember]

    setGroups(updated)
    setDraggedMember(null)
    setDraggedGroup(null)
  }

  const resetForm = () => {
    setDate('')
    setTime('21시')
    setBoss('커츠')
    setSelectedItem('')
    setAdena('')
    setMemberSearch('')
    setSelectedMembers([])
    setEditingIndex(null)
  }

  const saveRaid = async () => {
  if (selectedMembers.length === 0) {
    alert('참가 인원을 선택하세요')
    return
  }

  if (!adena || Number(adena) <= 0) {
    alert('분배금을 입력하세요')
    return
  }

  const history = {
    date,
    time,
    boss,
    item: selectedItem,
    totalAdena: Number(adena),
    participants: selectedMembers,
    perPerson,
  }

  let updatedHistory

  if (editingIndex !== null) {
    updatedHistory = raidHistory.map((raid, idx) =>
      idx === editingIndex ? history : raid
    )
  } else {
    updatedHistory = [history, ...raidHistory]
  }

  const recalculated = recalculateGroups(
    updatedHistory,
    paymentHistory,
    groups
  )

  setRaidHistory(updatedHistory)

  const saved = await saveData(
    recalculated,
    updatedHistory,
    paymentHistory
  )

  if (!saved) return

  resetForm()

  alert(editingIndex !== null ? '회차 수정 완료' : '회차 저장 완료')
}

  const deleteRaid = async (index) => {
  if (paymentHistory.length > 0) {
    const firstConfirm = confirm(
      '지급 히스토리가 존재합니다. 회차를 삭제하면 정산 데이터가 달라질 수 있습니다. 그래도 삭제할까요?'
    )
    if (!firstConfirm) return
  }

  if (!confirm('이 회차를 삭제할까요?')) return

  const updatedHistory = raidHistory.filter((_, idx) => idx !== index)

  const recalculated = recalculateGroups(
    updatedHistory,
    paymentHistory,
    groups
  )

  setRaidHistory(updatedHistory)

  const saved = await saveData(
    recalculated,
    updatedHistory,
    paymentHistory
  )

  if (!saved) return

  if (selectedRaid === raidHistory[index]) {
    setSelectedRaid(null)
  }
}

  const editRaid = (raid, index) => {
    setDate(raid.date || '')
    setTime(raid.time)
    setBoss(raid.boss)
    setSelectedItem(raid.item || '')
    setAdena(String(raid.totalAdena || ''))
    setSelectedMembers(raid.participants)
    setEditingIndex(index)
    setSelectedRaid(null)
    setActiveTab('input')
  }

  const payMember = async (member) => {
  if (member.unpaid <= 0) {
    alert('미수령 금액이 없습니다.')
    return
  }

  if (!confirm(`${member.name}님에게 ${formatNumber(member.unpaid)} 지급완료 처리할까요?`)) {
    return
  }

  const payment = {
    memberName: member.name,
    amount: member.unpaid,
    paidAt: new Date().toLocaleString('ko-KR'),
  }

  const updatedPayments = [payment, ...paymentHistory]

  const recalculated = recalculateGroups(
    raidHistory,
    updatedPayments,
    groups
  )

  setPaymentHistory(updatedPayments)

  const saved = await saveData(
    recalculated,
    raidHistory,
    updatedPayments
  )

  if (!saved) return

  setSelectedPayoutMembers((prev) =>
    prev.filter((name) => name !== member.name)
  )

  alert('지급완료 처리되었습니다.')
}

  const togglePayoutMember = (memberName) => {
    setSelectedPayoutMembers((prev) =>
      prev.includes(memberName)
        ? prev.filter((name) => name !== memberName)
        : [...prev, memberName]
    )
  }

  const selectAllPayoutMembers = () => {
    const unpaidMembers = getAllMembers()
      .filter((member) => member.unpaid > 0)
      .map((member) => member.name)

    setSelectedPayoutMembers(unpaidMembers)
  }

  const selectClassPayoutMembers = (members) => {
    const unpaidMembers = members
      .filter((member) => member.unpaid > 0)
      .map((member) => member.name)

    setSelectedPayoutMembers((prev) => [...new Set([...prev, ...unpaidMembers])])
  }

  const clearPayoutSelection = () => {
    setSelectedPayoutMembers([])
  }

  const paySelectedMembers = async () => {
  const targets = getAllMembers().filter(
    (member) =>
      selectedPayoutMembers.includes(member.name) &&
      member.unpaid > 0
  )

  if (targets.length === 0) {
    alert('선택된 미수령자가 없습니다.')
    return
  }

  if (!confirm(`${targets.length}명 일괄 지급 처리할까요?`)) {
    return
  }

  const newPayments = targets.map((member) => ({
    memberName: member.name,
    amount: member.unpaid,
    paidAt: new Date().toLocaleString('ko-KR'),
  }))

  const updatedPayments = [...newPayments, ...paymentHistory]

  const recalculated = recalculateGroups(
    raidHistory,
    updatedPayments,
    groups
  )

  setPaymentHistory(updatedPayments)

  const saved = await saveData(
    recalculated,
    raidHistory,
    updatedPayments
  )

  if (!saved) return

  setSelectedPayoutMembers([])

  alert('일괄 지급 완료')
}

  const undoPayment = async (paymentIndex) => {
  if (!confirm('이 지급 처리를 되돌릴까요?')) return

  const updatedPayments = paymentHistory.filter((_, idx) => idx !== paymentIndex)

  const recalculated = recalculateGroups(
    raidHistory,
    updatedPayments,
    groups
  )

  setPaymentHistory(updatedPayments)

  const saved = await saveData(
    recalculated,
    raidHistory,
    updatedPayments
  )

  if (!saved) return

  setSelectedPaymentHistory((prev) =>
    prev.filter((idx) => idx !== paymentIndex)
  )

  alert('지급 처리를 되돌렸습니다.')
}

  const togglePaymentHistory = (index) => {
    setSelectedPaymentHistory((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    )
  }

  const selectAllPaymentHistory = () => {
    setSelectedPaymentHistory(paymentHistory.map((_, idx) => idx))
  }

  const clearPaymentHistorySelection = () => {
    setSelectedPaymentHistory([])
  }

  const undoSelectedPayments = async () => {
  if (selectedPaymentHistory.length === 0) {
    alert('선택된 지급 히스토리가 없습니다.')
    return
  }

  if (!confirm(`${selectedPaymentHistory.length}건의 지급 처리를 되돌릴까요?`)) {
    return
  }

  const updatedPayments = paymentHistory.filter(
    (_, idx) => !selectedPaymentHistory.includes(idx)
  )

  const recalculated = recalculateGroups(
    raidHistory,
    updatedPayments,
    groups
  )

  setPaymentHistory(updatedPayments)

  const saved = await saveData(
    recalculated,
    raidHistory,
    updatedPayments
  )

  if (!saved) return

  setSelectedPaymentHistory([])

  alert('선택한 지급 처리를 되돌렸습니다.')
}

  const resetAppState = (serverId = selectedServerId) => {
    setGroups(getDefaultGroups(serverId))
    setSelectedMembers([])
    setRaidHistory([])
    setPaymentHistory([])
    setSelectedPayoutMembers([])
    setSelectedPaymentHistory([])
    setActiveTab('input')
    setSelectedRaid(null)
    setEditingIndex(null)
    resetForm()
  }

  const loadData = async (serverId = selectedServerId) => {
    const { data, error } = await supabase
      .from('app_state')
      .select('*')
      .eq('id', serverId)
      .maybeSingle()

    if (error) {
      console.error(error)
      alert('서버 데이터를 불러오지 못했습니다.')
      return false
    }

    if (!data?.data) {
      const defaultGroups = getDefaultGroups(serverId)

      setGroups(defaultGroups)
      setRaidHistory([])
      setPaymentHistory([])

      await saveData(
        defaultGroups,
        [],
        [],
        serverId
      )

      return true
    }

    const saved = data.data

    const hasSavedMembers =
      saved.groups &&
      Object.values(saved.groups).some(
        (members) => Array.isArray(members) && members.length > 0
      )

    if (hasSavedMembers) {
      setGroups(saved.groups)
    } else {
      const defaultGroups = getDefaultGroups(serverId)

      setGroups(defaultGroups)

      await saveData(
        defaultGroups,
        saved.raidHistory || [],
        saved.paymentHistory || [],
        serverId
      )
    }

    setRaidHistory(saved.raidHistory || [])
    setPaymentHistory(saved.paymentHistory || [])

    return true
  }

  const saveData = async (
    updatedGroups = groups,
    updatedRaidHistory = raidHistory,
    updatedPaymentHistory = paymentHistory,
    serverId = selectedServerId
  ) => {
    const payload = {
      groups: updatedGroups,
      raidHistory: updatedRaidHistory,
      paymentHistory: updatedPaymentHistory,
    }

    const { error } = await supabase
      .from('app_state')
      .upsert(
        {
          id: serverId,
          data: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      )

    if (error) {
      console.error(error)
      alert('DB 저장 실패')
      return false
    }

    console.log('DB 저장 성공:', serverId)
    return true
  }

  useEffect(() => {
    if (isLoggedIn) {
      loadData(selectedServerId)
    }
  }, [isLoggedIn, selectedServerId])

  const currentServer = servers.find((server) => server.id === selectedServerId)

  const handleLogin = async () => {
    const server = servers.find((item) => item.id === selectedServerId)

    if (!server) {
      alert('서버를 선택하세요.')
      return
    }

    if (passwordInput !== server.password) {
      alert('비밀번호가 틀렸습니다.')
      return
    }

    resetAppState(selectedServerId)
    setIsLoggedIn(true)
    setPasswordInput('')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setPasswordInput('')
    resetAppState(selectedServerId)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl border shadow-sm p-8 w-[390px]">
          <h1 className="text-2xl font-bold mb-4">
            리니지클래식 분배 계산기
          </h1>

          <p className="text-gray-500 text-sm mb-5">
            서버를 선택하고 비밀번호를 입력하세요.
          </p>

          <div className="font-bold text-sm mb-2">
            서버 선택
          </div>

          <select
            value={selectedServerId}
            onChange={(e) => setSelectedServerId(e.target.value)}
            className="w-full border rounded-xl px-4 py-3 mb-4"
          >
            {servers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.name}
              </option>
            ))}
          </select>

          <div className="font-bold text-sm mb-2">
            비밀번호
          </div>

          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleLogin()
            }}
            placeholder="비밀번호"
            className="w-full border rounded-xl px-4 py-3 mb-4"
          />

          <button
            onClick={handleLogin}
            className="w-full bg-yellow-400 hover:bg-yellow-500 rounded-xl py-3 font-bold"
          >
            접속하기
          </button>

          <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500 leading-6">
            <div>made by 군터서버 반격라인 왕혈 발트리스</div>
            <div>도움주신분들 데스나이트 약탈자 삼고초려</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('input')}
            className={`px-5 py-3 rounded-2xl font-bold border ${activeTab === 'input' ? 'bg-yellow-400 border-yellow-500' : 'bg-white'}`}
          >
            분배 입력
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-3 rounded-2xl font-bold border ${activeTab === 'history' ? 'bg-yellow-400 border-yellow-500' : 'bg-white'}`}
          >
            회차별 리스트
          </button>

          <button
            onClick={() => setActiveTab('payout')}
            className={`px-5 py-3 rounded-2xl font-bold border ${activeTab === 'payout' ? 'bg-yellow-400 border-yellow-500' : 'bg-white'}`}
          >
            미수령 정산
          </button>

          <button
            onClick={() => setActiveTab('memberManage')}
            className={`px-5 py-3 rounded-2xl font-bold border ${
              activeTab === 'memberManage'
                ? 'bg-blue-500 text-white border-blue-600'
                : 'bg-white'
            }`}
          >
            혈원 관리
          </button>

            <button
    onClick={handleLogout}
    className="px-5 py-3 rounded-2xl font-bold border bg-white"
  >
    로그아웃
  </button>

        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            리니지클래식 분배 계산기
          </h1>

          <p className="text-gray-500">
            {currentServer?.name || '서버'} · 보스탐 분배 시스템
          </p>
        </div>

        {activeTab === 'input' && (
          <>
            <div className="bg-white rounded-2xl border p-6 mb-6 shadow-sm">
              {editingIndex !== null && (
                <div className="mb-4 rounded-xl bg-blue-50 border border-blue-300 p-3 text-blue-700 font-bold">
                  현재 회차 수정 중입니다.
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-bold text-sm mb-2">날짜</div>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full border rounded-xl px-3 py-3"
                    />
                  </div>

                  <div>
                    <div className="font-bold text-sm mb-2">타임</div>
                    <select
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full border rounded-xl px-3 py-3"
                    >
                      {bossTimes.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="font-bold text-sm mb-2">보스</div>
                    <select
                      value={boss}
                      onChange={(e) => setBoss(e.target.value)}
                      className="w-full border rounded-xl px-3 py-3"
                    >
                      {bosses.map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="font-bold text-sm mb-2">아이템</div>
                    <select
                      value={selectedItem}
                      onChange={(e) => setSelectedItem(e.target.value)}
                      className="w-full border rounded-xl px-3 py-3"
                    >
                      <option value="">아이템 선택</option>
                      {itemList.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="font-bold text-sm mb-2">분배금</div>
                    <input
                      type="text"
                      value={adena}
                      onChange={(e) => setAdena(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="12000000"
                      className="w-full border rounded-xl px-3 py-3"
                    />
                  </div>

                  <div>
                    <div className="font-bold text-sm mb-2">혈원명 검색</div>
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      placeholder="혈원명을 입력하세요"
                      className="w-full border rounded-xl px-4 py-3"
                    />
                  </div>
                </div>

                {memberSearch && (
                  <div className="grid grid-cols-5 gap-2">
                    {searchedMembers.map((member) => {
                      const selected = selectedMembers.includes(member.name)

                      return (
                        <button
                          key={member.name}
                          onClick={() => toggleMember(member.name)}
                          className={`px-3 py-2 rounded-xl border text-sm font-bold text-left ${
                            selected
                              ? 'bg-yellow-100 border-yellow-400'
                              : 'bg-white hover:bg-yellow-50'
                          }`}
                        >
                          {member.name}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 border rounded-2xl p-4">
                    <div className="text-sm text-gray-500 mb-2">참가 인원</div>
                    <div className="text-3xl font-bold">{participantCount}명</div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4">
                    <div className="text-sm text-gray-500 mb-2">인당 분배금</div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {formatNumber(perPerson)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveRaid}
                  className="bg-yellow-400 hover:bg-yellow-500 px-6 py-3 rounded-2xl font-bold"
                >
                  {editingIndex !== null ? '수정 저장' : '회차 저장'}
                </button>

                {editingIndex !== null && (
                  <button
                    onClick={resetForm}
                    className="bg-gray-200 hover:bg-gray-300 px-6 py-3 rounded-2xl font-bold"
                  >
                    수정 취소
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-5">
              {Object.entries(groups).map(([groupName, members]) => (
                <div
                  key={groupName}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => dropMember(groupName)}
                  className="bg-white rounded-2xl border shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-lg">{groupName}</div>
                      <div className="text-sm text-gray-500">{members.length}명</div>
                    </div>
                  </div>

                  <div className="p-3 grid grid-cols-3 gap-2 min-h-[650px]">
                    {[...members]
                      .sort((a, b) => getParticipationRate(b) - getParticipationRate(a))
                      .map((member) => {
                        const selected = selectedMembers.includes(member.name)

                        return (
                          <div
                            key={member.name}
                            draggable
                            onDragStart={() => dragStart(member, groupName)}
                            onClick={() => toggleMember(member.name)}
                            className={`flex items-center justify-between gap-2 text-sm px-3 py-3 rounded-xl border cursor-pointer transition-all hover:bg-yellow-50 ${selected ? 'bg-yellow-100 border-yellow-400 shadow-sm' : 'bg-white border-gray-200'}`}
                          >
                            <div className="font-bold text-[15px] truncate">
                              {member.name}
                            </div>

                            <div className="font-semibold text-blue-600 whitespace-nowrap">
                              {getParticipationRate(member)}%
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border p-5 mt-6">
            <h2 className="text-xl font-bold mb-4">
              회차별 리스트
            </h2>

            <div className="grid grid-cols-3 gap-4">
              {raidHistory.length === 0 && (
                <div className="text-gray-500 text-sm">
                  저장된 회차가 없습니다.
                </div>
              )}

              {[...raidHistory]
  .sort((a, b) => {

    const timeOrder = {
      '01시': 1,
      '03시': 3,
      '05시': 5,
      '06시': 6,
      '07시': 7,
      '09시': 9,
      '11시': 11,
      '12시': 12,
      '13시': 13,
      '15시': 15,
      '17시': 17,
      '18시': 18,
      '19시': 19,
      '21시': 21,
      '22시': 22,
      '24시': 24,
    }

    const aDate = new Date(`${a.date} ${timeOrder[a.time] || 0}:00`)
    const bDate = new Date(`${b.date} ${timeOrder[b.time] || 0}:00`)

    return bDate - aDate
  })
  .map((raid, idx) => (
                <div
                  key={idx}
                  className="border rounded-xl p-4 bg-gray-50 min-h-[130px]"
                >
                  <div>
                    <div className="font-bold">
                      {raid.date || '날짜 없음'} / {raid.time} / {raid.boss} / {raid.item || '아이템 없음'}
                    </div>

                    <div className="text-sm text-gray-600 mt-1">
                      참가 {raid.participants.length}명 · 총 {formatNumber(raid.totalAdena)} · 인당 {formatNumber(raid.perPerson)}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => setSelectedRaid(raid)}
                      className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-600"
                    >
                      상세
                    </button>

                    <button
                      onClick={() => editRaid(raid, idx)}
                      className="px-4 py-2 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-500"
                    >
                      수정
                    </button>

                    <button
                      onClick={() => deleteRaid(idx)}
                      className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'payout' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border p-5">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  미수령 정산
                </h2>

                <div className="flex gap-2">
                  <button
                    onClick={selectAllPayoutMembers}
                    className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold"
                  >
                    전체 선택
                  </button>

                  <button
                    onClick={clearPayoutSelection}
                    className="px-4 py-2 rounded-xl bg-gray-200 font-bold"
                  >
                    선택 해제
                  </button>

                  <button
                    onClick={paySelectedMembers}
                    className="px-4 py-2 rounded-xl bg-green-500 text-white font-bold"
                  >
                    선택 일괄 지급
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-5">
              {Object.entries(groups).map(([groupName, members]) => (
                <div
                  key={groupName}
                  className="bg-white rounded-2xl border shadow-sm overflow-hidden"
                >
                  <div className="px-5 py-4 border-b bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="font-bold text-lg">{groupName}</div>

                      <button
                        onClick={() => selectClassPayoutMembers(members)}
                        className="text-xs px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold"
                      >
                        클래스 전체 선택
                      </button>
                    </div>
                  </div>

                  <div className="p-3 space-y-1 min-h-[420px]">
                    {[...members]
                      .filter((member) => member.unpaid > 0)
                      .sort((a, b) => b.unpaid - a.unpaid)
                      .map((member) => {
                        const checked = selectedPayoutMembers.includes(member.name)

                        return (
                          <div
                            key={member.name}
                            className={`grid grid-cols-[24px_110px_1fr_70px] items-center gap-2 text-xs px-3 py-2 rounded-xl border ${checked ? 'bg-green-100 border-green-400' : 'bg-white border-gray-200'}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePayoutMember(member.name)}
                            />

                            <div className="font-bold truncate">{member.name}</div>

                            <div className="text-right font-bold text-red-600 truncate">
                              {formatNumber(member.unpaid)}
                            </div>

                            <button
                              onClick={() => payMember({ ...member, groupName })}
                              className="px-2 py-1 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600"
                            >
                              지급
                            </button>
                          </div>
                        )
                      })}

                    {members.filter((member) => member.unpaid > 0).length === 0 && (
                      <div className="text-sm text-gray-400 p-3">
                        미수령 없음
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl border p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  지급 히스토리
                </h2>

                <div className="flex gap-2">
                  <button
                    onClick={selectAllPaymentHistory}
                    className="px-3 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold"
                  >
                    전체 선택
                  </button>

                  <button
                    onClick={clearPaymentHistorySelection}
                    className="px-3 py-2 rounded-xl bg-gray-200 text-sm font-bold"
                  >
                    선택 해제
                  </button>

                  <button
                    onClick={undoSelectedPayments}
                    className="px-3 py-2 rounded-xl bg-red-500 text-white text-sm font-bold"
                  >
                    선택 되돌리기
                  </button>
                </div>
              </div>

              {paymentHistory.length === 0 && (
                <div className="text-gray-500 text-sm">
                  지급 히스토리가 없습니다.
                </div>
              )}

              <div className="max-h-[360px] overflow-y-auto pr-2">
                <div className="grid grid-cols-4 gap-3">
                  {paymentHistory.map((payment, idx) => {
                    const checked = selectedPaymentHistory.includes(idx)

                    return (
                      <div
                        key={idx}
                        className={`border rounded-xl p-3 text-xs ${checked ? 'bg-red-50 border-red-300' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePaymentHistory(idx)}
                          />

                          <div className="font-bold truncate">
                            {payment.memberName}
                          </div>
                        </div>

                        <div className="text-red-600 font-bold mb-1">
                          {formatNumber(payment.amount)}
                        </div>

                        <div className="text-gray-500 text-[11px] mb-3">
                          {payment.paidAt}
                        </div>

                        <button
                          onClick={() => undoPayment(idx)}
                          className="w-full px-2 py-1 rounded-lg bg-red-100 text-red-600 font-bold hover:bg-red-200"
                        >
                          되돌리기
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedRaid && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-[700px] max-h-[80vh] overflow-auto p-6">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-2xl font-bold">회차 상세</h2>

                <button
                  onClick={() => setSelectedRaid(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200"
                >
                  닫기
                </button>
              </div>

              <div className="space-y-2 mb-5">
                <div>날짜: {selectedRaid.date || '-'}</div>
                <div>시간: {selectedRaid.time}</div>
                <div>보스: {selectedRaid.boss}</div>
                <div>아이템: {selectedRaid.item || '-'}</div>
                <div>총 분배금: {formatNumber(selectedRaid.totalAdena)}</div>
                <div>인당 분배금: {formatNumber(selectedRaid.perPerson)}</div>
              </div>

              <div className="flex justify-between items-center mb-3">

                <div className="font-bold">
                  참가자 목록
             </div>

                <div className="text-sm font-bold text-blue-600">
                  총 {selectedRaid.participants.length}명
             </div>

           </div>

              <div className="grid grid-cols-3 gap-2">
                {selectedRaid.participants.map((member) => (
                  <div
                    key={member}
                    className="border rounded-xl px-3 py-2 bg-gray-50"
                  >
                    {member}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'memberManage' && (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl border p-6 shadow-sm">
      <h2 className="text-xl font-bold mb-4">혈원 추가</h2>

      <div className="grid grid-cols-3 gap-3">
        {newMembers.map((member, idx) => (
          <div key={idx} className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={`혈원명 ${idx + 1}`}
              value={member.name}
              onChange={(e) => {
                const updated = [...newMembers]
                updated[idx] = {
                  ...updated[idx],
                  name: e.target.value,
                }
                setNewMembers(updated)
              }}
              className="border rounded-xl px-3 py-2"
            />

            <select
              value={member.group}
              onChange={(e) => {
                const updated = [...newMembers]
                updated[idx] = {
                  ...updated[idx],
                  group: e.target.value,
                }
                setNewMembers(updated)
              }}
              className="border rounded-xl px-3 py-2"
            >
              <option>기사</option>
              <option>요정</option>
              <option>법사</option>
              <option>미확인</option>
            </select>
          </div>
        ))}
      </div>

      <button
        onClick={addMembers}
        className="mt-4 px-5 py-3 rounded-xl bg-green-500 text-white font-bold"
      >
        혈원 추가 저장
      </button>
    </div>

    <div className="bg-white rounded-2xl border p-6 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">혈원 수정 / 삭제</h2>

        <button
          onClick={deleteSelectedMembers}
          className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold"
        >
          선택 삭제
        </button>
      </div>

      <div className="grid grid-cols-4 gap-5">
        {Object.entries(groups).map(([groupName, members]) => (
          <div key={groupName} className="border rounded-2xl p-4">
            <div className="font-bold text-lg mb-3">
              {groupName} {members.length}명
            </div>

            <div className="grid grid-cols-3 gap-2">
  {members.map((member) => {
    const selected = selectedDeleteMembers.includes(member.name)

    return (
      <div
        key={member.name}
        onClick={() => {
          setSelectedDeleteMembers((prev) =>
            prev.includes(member.name)
              ? prev.filter((name) => name !== member.name)
              : [...prev, member.name]
          )
        }}
        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm cursor-pointer ${
          selected
            ? 'bg-red-100 border-red-400 text-red-700'
            : 'bg-white border-gray-200 hover:bg-red-50'
        }`}
      >
        <div className="font-bold truncate">
          {member.name}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setEditingMember(member)
            setEditingMemberName(member.name)
          }}
          className="shrink-0 px-2 py-1 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold hover:bg-yellow-200"
        >
          수정
        </button>
      </div>
    )
  })}
</div>
          </div>
        ))}
      </div>
    </div>

    {editingMember && (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-[400px]">
          <h3 className="text-xl font-bold mb-4">혈원 수정</h3>

          <input
            type="text"
            value={editingMemberName}
            onChange={(e) => setEditingMemberName(e.target.value)}
            className="w-full border rounded-xl px-3 py-3 mb-4"
          />

          <div className="flex gap-2">
            <button
              onClick={updateMemberName}
              className="flex-1 bg-yellow-400 rounded-xl py-3 font-bold"
            >
              저장
            </button>

            <button
              onClick={() => setEditingMember(null)}
              className="flex-1 bg-gray-200 rounded-xl py-3 font-bold"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
)}

      </div>
    </div>
  )
}